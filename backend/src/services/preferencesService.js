/**
 * Preferences Service
 * 
 * Manages user music preferences built from behavior.
 * Tracks genre weights, favorite artists, and listening patterns.
 * 
 * Used by the Home module to personalize recommendations.
 * 
 * Preference types:
 *   - "genre": Genre weights (e.g. rock: 1.00, pop: 0.30)
 *   - "artist": Artist affinity (from plays, favorites)
 *   - "track": Track affinity (repeat plays)
 */

import { pool } from '../database/pool.js';

// Default genre weights (rock-focused)
const DEFAULT_GENRE_WEIGHTS = {
  'rock': 1.00,
  'classic-rock': 0.95,
  'alternative-rock': 0.75,
  'hard-rock': 0.70,
  'metal': 0.50,
  'pop': 0.20,
  'electronic': 0.15,
  'indie': 0.40,
  'grunge': 0.60,
  'punk': 0.45,
};

/**
 * Get user preferences by type.
 * Returns sorted by value descending.
 */
export async function getUserPreferences(userId, type = 'genre') {
  try {
    const [rows] = await pool.execute(
      `SELECT preference_key, preference_value, play_count, last_interaction
       FROM user_preferences
       WHERE user_id = ? AND preference_type = ?
       ORDER BY preference_value DESC`,
      [userId, type]
    );
    return rows;
  } catch (err) {
    // Table might not exist yet - return empty
    if (err.code === 'ER_NO_SUCH_TABLE') return [];
    throw err;
  }
}

/**
 * Get user genre weights.
 * Returns a map of genreId -> weight.
 * Falls back to defaults if no preferences exist.
 */
export async function getUserGenreWeights(userId) {
  const prefs = await getUserPreferences(userId, 'genre');

  if (prefs.length === 0) {
    return { ...DEFAULT_GENRE_WEIGHTS };
  }

  const weights = {};
  for (const p of prefs) {
    weights[p.preference_key] = parseFloat(p.preference_value);
  }
  return weights;
}

/**
 * Update a user preference (upsert).
 * Increments play_count and adjusts the value.
 */
export async function updatePreference(userId, type, key, valueIncrement = 0.05) {
  try {
    await pool.execute(
      `INSERT INTO user_preferences (user_id, preference_type, preference_key, preference_value, play_count)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         preference_value = LEAST(10.00, preference_value + ?),
         play_count = play_count + 1,
         last_interaction = CURRENT_TIMESTAMP`,
      [userId, type, key, valueIncrement, valueIncrement]
    );
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return; // Graceful degradation
    console.error('[Preferences] Error updating preference:', err.message);
  }
}

/**
 * Record a track play and update related preferences.
 * Called when a user plays a track.
 * 
 * Updates:
 *   - Track preference (play count)
 *   - Artist preference
 *   - Genre preferences (inferred from artist/context)
 */
export async function recordPlay(userId, track) {
  if (!userId || !track) return;

  const externalId = track.source?.id || track.externalId || '';
  const artist = track.artist || '';

  // Update track preference
  if (externalId) {
    await updatePreference(userId, 'track', externalId, 0.02);
  }

  // Update artist preference
  if (artist) {
    await updatePreference(userId, 'artist', artist.toLowerCase(), 0.05);
  }
}

/**
 * Record a favorite action and boost preferences.
 * Favorites have higher weight than plays.
 */
export async function recordFavorite(userId, track) {
  if (!userId || !track) return;

  const externalId = track.source?.id || track.externalId || track.external_track_id || '';
  const artist = track.artist || '';

  // Boost track preference
  if (externalId) {
    await updatePreference(userId, 'track', externalId, 0.10);
  }

  // Boost artist preference
  if (artist) {
    await updatePreference(userId, 'artist', artist.toLowerCase(), 0.15);
  }
}

/**
 * Update genre preference directly.
 */
export async function updateGenrePreference(userId, genreId, weight) {
  try {
    await pool.execute(
      `INSERT INTO user_preferences (user_id, preference_type, preference_key, preference_value, play_count)
       VALUES (?, 'genre', ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         preference_value = ?,
         play_count = play_count + 1,
         last_interaction = CURRENT_TIMESTAMP`,
      [userId, genreId, weight, weight]
    );
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return;
    console.error('[Preferences] Error updating genre preference:', err.message);
  }
}

/**
 * Get the user's top preferred artists.
 */
export async function getTopArtists(userId, limit = 10) {
  return getUserPreferences(userId, 'artist').then(prefs =>
    prefs.slice(0, limit).map(p => ({
      name: p.preference_key,
      weight: parseFloat(p.preference_value),
      playCount: p.play_count,
    }))
  );
}

/**
 * Get all preference data for a user (for API response).
 */
export async function getAllPreferences(userId) {
  const [genres, artists, tracks] = await Promise.all([
    getUserPreferences(userId, 'genre'),
    getUserPreferences(userId, 'artist'),
    getUserPreferences(userId, 'track'),
  ]);

  return {
    genres: genres.map(p => ({
      id: p.preference_key,
      weight: parseFloat(p.preference_value),
      playCount: p.play_count,
    })),
    artists: artists.slice(0, 20).map(p => ({
      name: p.preference_key,
      weight: parseFloat(p.preference_value),
      playCount: p.play_count,
    })),
    trackCount: tracks.length,
    totalPlays: tracks.reduce((sum, p) => sum + (p.play_count || 0), 0),
  };
}
