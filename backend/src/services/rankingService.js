/**
 * Ranking Service
 * 
 * Provides scoring and ranking for tracks.
 * Used primarily for generating Top 10 lists for artists.
 * 
 * The ranking algorithm considers:
 * 1. Artist name match (title contains artist name)
 * 2. Music relevance (filtering non-music content)
 * 3. View count proxy (video duration as quality signal)
 * 4. Deduplication (removes near-duplicate titles)
 * 5. Channel match (video from the artist's own channel)
 */

/**
 * Calculate a relevance score for a track relative to an artist.
 * 
 * @param {Track} track - Normalized track
 * @param {string} artistName - Expected artist name
 * @param {string|null} artistChannelId - Artist's YouTube channel ID
 * @returns {number} Score between 0 and 100
 */
export function calculateTrackScore(track, artistName, artistChannelId = null) {
  let score = 50; // Base score

  const title = (track.title || '').toLowerCase();
  const trackArtist = (track.artist || '').toLowerCase();
  const normalizedArtistName = (artistName || '').toLowerCase();

  // 1. Artist name match in track artist field (+20)
  if (trackArtist.includes(normalizedArtistName) || normalizedArtistName.includes(trackArtist)) {
    score += 20;
  }

  // 2. Channel match - track from artist's own channel (+15)
  if (artistChannelId && track.artistId) {
    const trackChannelId = track.artistId.includes(':')
      ? track.artistId.split(':').slice(1).join(':')
      : track.artistId;
    if (trackChannelId === artistChannelId) {
      score += 15;
    }
  }

  // 3. Music indicators in title (+5 each, max +10)
  const musicIndicators = ['official', 'music video', 'audio', 'lyrics', 'video oficial', 'hd', 'remastered'];
  let musicBonus = 0;
  for (const indicator of musicIndicators) {
    if (title.includes(indicator) || (track.title || '').toLowerCase().includes(indicator)) {
      musicBonus += 5;
      if (musicBonus >= 10) break;
    }
  }
  score += musicBonus;

  // 4. Penalty for non-music content (-20)
  const nonMusicIndicators = ['interview', 'behind the scenes', 'documentary', 'reaction', 'review', 'tutorial', 'cover', 'karaoke', 'instrumental'];
  for (const indicator of nonMusicIndicators) {
    if (title.includes(indicator)) {
      score -= 20;
      break;
    }
  }

  // 5. Duration quality signal
  // Songs typically 2-7 minutes. Too short or too long = lower score
  const duration = track.duration || 0;
  if (duration >= 120 && duration <= 420) {
    score += 5; // Ideal song length
  } else if (duration > 600) {
    score -= 5; // Probably a compilation or live set
  } else if (duration < 60 && duration > 0) {
    score -= 10; // Too short, likely a clip
  }

  // 6. Penalty for "live" versions (-5) - studio versions are preferred
  if (title.includes('live') && !title.includes('live music')) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Normalize a title for deduplication comparison.
 * Removes common suffixes, whitespace variations, and case.
 */
function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/\s*[\(\[](official\s*(music\s*)?video|lyrics|audio|lyric\s*video|official\s*audio|hd|hq|remastered|live|visualizer|video\s*oficial)[\)\]]/gi, '')
    .replace(/\s*[-–—]\s*(official|video|audio|lyrics|hd|hq|remastered).*$/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicate tracks by normalized title similarity.
 * Keeps the highest-scored version of similar tracks.
 */
export function deduplicateTracks(scoredTracks) {
  const seen = new Map();

  for (const { track, score } of scoredTracks) {
    const normalized = normalizeTitle(track.title);
    if (!normalized) continue;

    const existing = seen.get(normalized);
    if (!existing || existing.score < score) {
      seen.set(normalized, { track, score });
    }
  }

  return Array.from(seen.values());
}

/**
 * Generate a Top N ranking for an artist.
 * 
 * @param {Track[]} tracks - All tracks found for the artist
 * @param {string} artistName - Artist name for scoring
 * @param {string|null} artistChannelId - Artist's YouTube channel ID
 * @param {number} topN - Number of top results (default 10)
 * @returns {Track[]} Top N tracks sorted by score
 */
export function generateTopTracks(tracks, artistName, artistChannelId = null, topN = 10) {
  // 1. Score all tracks
  const scored = tracks.map(track => ({
    track,
    score: calculateTrackScore(track, artistName, artistChannelId),
  }));

  // 2. Deduplicate
  const deduped = deduplicateTracks(scored);

  // 3. Sort by score descending
  deduped.sort((a, b) => b.score - a.score);

  // 4. Return top N
  return deduped.slice(0, topN).map(({ track }) => track);
}
