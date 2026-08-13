/**
 * Home Module
 * 
 * Generates the personalized home page with dynamic sections.
 * Each section has a type, title, and items (tracks/artists).
 * 
 * Section types:
 *   - "recommended": Personalized recommendations ("Para ti")
 *   - "genre": Genre-based content
 *   - "featured": Admin-curated featured content
 *   - "recent": Recently played (requires auth)
 *   - "favorites": User favorites (requires auth)
 *   - "artists": Artist recommendations
 */

import * as contentService from '../services/contentService.js';
import { getGenreSearchQuery, getGenreDefinition } from './genres.js';
import { sendSuccess } from '../utils/response.js';
import { pool } from '../database/pool.js';
import { getCached, setCached } from '../services/cacheService.js';
import { getUserGenreWeights, getTopArtists } from '../services/preferencesService.js';

// Default genres to show on home page (rock-focused initially)
const DEFAULT_HOME_GENRES = ['rock', 'classic-rock', 'alternative-rock', 'hard-rock', 'metal'];

const GENRE_DISPLAY_NAMES = {
  'rock': 'Rock',
  'classic-rock': 'Rock Clásico',
  'alternative-rock': 'Rock Alternativo',
  'hard-rock': 'Hard Rock',
  'metal': 'Metal',
};

const ITEMS_PER_SECTION = 6;

/**
 * Build a single genre section
 */
async function buildGenreSection(genreId, displayName) {
  const cacheKey = `home:genre:${genreId}`;
  const cached = await getCached('home', cacheKey, 'retroplayer', 1800);
  if (cached) return cached;

  try {
    const query = getGenreSearchQuery(genreId);
    const { tracks } = await contentService.getTracksByGenre(query, ITEMS_PER_SECTION);
    const section = {
      type: 'genre',
      title: displayName,
      genre: genreId,
      items: tracks,
    };
    await setCached('home', cacheKey, section, 'retroplayer', 1800);
    return section;
  } catch (err) {
    console.error(`[Home] Error building genre section "${genreId}":`, err.message);
    return { type: 'genre', title: displayName, genre: genreId, items: [] };
  }
}

/**
 * Build the "Para ti" recommended section.
 * Uses user genre preferences if available for personalized recommendations.
 */
async function buildRecommendedSection(userId = null) {
  // Use personalized cache key if user is authenticated
  const cacheKey = userId ? `home:recommended:user:${userId}` : 'home:recommended';
  const cached = await getCached('home', cacheKey, 'retroplayer', 1800);
  if (cached) return cached;

  let genre = 'rock';

  // If user is authenticated, use their top genre preference
  if (userId) {
    try {
      const weights = await getUserGenreWeights(userId);
      const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0 && entries[0][1] > 0) {
        genre = entries[0][0];
      }
    } catch {
      // Fall back to default
    }
  }

  try {
    const { tracks } = await contentService.getRecommended({
      genre,
      limit: ITEMS_PER_SECTION,
    });
    const section = {
      type: 'recommended',
      title: 'Para ti',
      items: tracks,
    };
    await setCached('home', cacheKey, section, 'retroplayer', 1800);
    return section;
  } catch (err) {
    console.error('[Home] Error building recommended section:', err.message);
    return { type: 'recommended', title: 'Para ti', items: [] };
  }
}

/**
 * Build "Artistas que te pueden gustar" section
 */
async function buildArtistsSection() {
  const cacheKey = 'home:artists';
  const cached = await getCached('home', cacheKey, 'retroplayer', 1800);
  if (cached) return cached;

  try {
    const { artists } = await contentService.searchArtists('rock bands', ITEMS_PER_SECTION);
    const section = {
      type: 'artists',
      title: 'Artistas que te pueden gustar',
      items: artists,
    };
    await setCached('home', cacheKey, section, 'retroplayer', 1800);
    return section;
  } catch (err) {
    console.error('[Home] Error building artists section:', err.message);
    return { type: 'artists', title: 'Artistas que te pueden gustar', items: [] };
  }
}

/**
 * Build "Escuchado recientemente" section (requires authenticated user)
 */
async function buildRecentSection(userId) {
  if (!userId) return null;

  try {
    const [rows] = await pool.execute(
      `SELECT external_track_id, source, title, artist, cover_url, duration_seconds
       FROM play_history
       WHERE user_id = ?
       ORDER BY played_at DESC
       LIMIT ?`,
      [userId, ITEMS_PER_SECTION]
    );

    if (rows.length === 0) return null;

    const items = rows.map(row => ({
      id: `${row.source}:${row.external_track_id}`,
      title: row.title,
      artist: row.artist,
      image: row.cover_url,
      duration: row.duration_seconds || 0,
      source: { provider: row.source, id: row.external_track_id },
    }));

    return {
      type: 'recent',
      title: 'Escuchado recientemente',
      items,
    };
  } catch (err) {
    console.error('[Home] Error building recent section:', err.message);
    return null;
  }
}

/**
 * Build "Tus favoritos" section (requires authenticated user)
 */
async function buildFavoritesSection(userId) {
  if (!userId) return null;

  try {
    const [rows] = await pool.execute(
      `SELECT external_track_id, source, title, artist, cover_url
       FROM favorite_tracks
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, ITEMS_PER_SECTION]
    );

    if (rows.length === 0) return null;

    const items = rows.map(row => ({
      id: `${row.source}:${row.external_track_id}`,
      title: row.title,
      artist: row.artist,
      image: row.cover_url,
      duration: 0,
      source: { provider: row.source, id: row.external_track_id },
    }));

    return {
      type: 'favorites',
      title: 'Tus favoritos',
      items,
    };
  } catch (err) {
    console.error('[Home] Error building favorites section:', err.message);
    return null;
  }
}

/**
 * Build "Destacados" section from featured_tracks table
 */
async function buildFeaturedSection(category = 'recommended') {
  try {
    const [rows] = await pool.execute(
      `SELECT external_track_id, source, title, artist, cover_url, category
       FROM featured_tracks
       WHERE active = 1 AND category = ?
       ORDER BY position ASC
       LIMIT ?`,
      [category, ITEMS_PER_SECTION]
    );

    if (rows.length === 0) return null;

    const items = rows.map(row => ({
      id: `${row.source}:${row.external_track_id}`,
      title: row.title,
      artist: row.artist,
      image: row.cover_url,
      duration: 0,
      source: { provider: row.source, id: row.external_track_id },
    }));

    return {
      type: 'featured',
      title: 'Destacados',
      items,
    };
  } catch (err) {
    console.error('[Home] Error building featured section:', err.message);
    return null;
  }
}

/**
 * GET /api/home
 * 
 * Returns personalized home page sections.
 * Optional auth: if authenticated, includes user-specific sections.
 */
export async function getHome(req, res) {
  // Try to get user from token (optional auth - not required)
  let userId = null;
  try {
    const { requireAuth } = await import('../middleware/authenticate.js');
    const user = await requireAuth(req);
    userId = user.id;
  } catch {
    // Not authenticated, that's fine - show generic content
  }

  const sections = [];

  // 1. "Para ti" (recommended, personalized if authenticated)
  const recommendedSection = await buildRecommendedSection(userId);
  if (recommendedSection) sections.push(recommendedSection);

  // 2. Featured (admin-curated)
  const featuredSection = await buildFeaturedSection();
  if (featuredSection) sections.push(featuredSection);

  // 3. User-specific sections
  const recentSection = await buildRecentSection(userId);
  if (recentSection) sections.push(recentSection);

  const favoritesSection = await buildFavoritesSection(userId);
  if (favoritesSection) sections.push(favoritesSection);

  // 4. Genre sections - ordered by user preference weights if available
  let homeGenres = [...DEFAULT_HOME_GENRES];
  if (userId) {
    try {
      const weights = await getUserGenreWeights(userId);
      // Sort genres by user preference weight (highest first)
      homeGenres.sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
    } catch {
      // Keep default order
    }
  }

  const genrePromises = homeGenres.map(genreId =>
    buildGenreSection(genreId, GENRE_DISPLAY_NAMES[genreId] || genreId)
  );
  const genreSections = await Promise.all(genrePromises);
  for (const gs of genreSections) {
    if (gs && gs.items.length > 0) sections.push(gs);
  }

  // 5. "Artistas que te pueden gustar"
  const artistsSection = await buildArtistsSection();
  if (artistsSection) sections.push(artistsSection);

  sendSuccess(res, 200, { sections });
}
