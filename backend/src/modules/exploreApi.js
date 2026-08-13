/**
 * Explore API Module
 * 
 * Provides the explore page data: genres, featured content,
 * top tracks, and discovery sections.
 * Different from Home: Home = personalized, Explore = discovery/catalog.
 */

import * as contentService from '../services/contentService.js';
import { getAllGenres, getGenreSearchQuery } from './genres.js';
import { sendSuccess } from '../utils/response.js';
import { pool } from '../database/pool.js';
import { getCached, setCached } from '../services/cacheService.js';

const EXPLORE_CACHE_TTL = 1800; // 30 minutes

/**
 * GET /api/explore/page
 * 
 * Returns the explore page structure with:
 * - Available genres
 * - Top tracks (rock by default)
 * - Featured albums/content
 */
export async function getExplorePage(req, res) {
  const cacheKey = 'explore:page';
  const cached = await getCached('explore', cacheKey, 'retroplayer', EXPLORE_CACHE_TTL);
  if (cached) {
    sendSuccess(res, 200, cached);
    return;
  }

  const genres = getAllGenres();

  // Fetch top 10 rock tracks and some highlighted content in parallel
  const [topRock, featuredTracks, trendingTracks] = await Promise.all([
    fetchTopGenreTracks('rock', 10),
    fetchFeaturedContent(),
    contentService.getRecommended({ genre: 'music trending', limit: 6 }),
  ]);

  const data = {
    genres,
    sections: [
      {
        type: 'top',
        title: 'Top 10 Rock',
        genre: 'rock',
        items: topRock,
      },
      {
        type: 'trending',
        title: 'Tendencias',
        items: trendingTracks.tracks || [],
      },
    ],
    featured: featuredTracks,
  };

  await setCached('explore', cacheKey, data, 'retroplayer', EXPLORE_CACHE_TTL);
  sendSuccess(res, 200, data);
}

/**
 * Fetch top tracks for a genre
 */
async function fetchTopGenreTracks(genreId, limit = 10) {
  try {
    const query = getGenreSearchQuery(genreId);
    const { tracks } = await contentService.getTracksByGenre(query, limit);
    return tracks;
  } catch (err) {
    console.error(`[Explore] Error fetching top tracks for "${genreId}":`, err.message);
    return [];
  }
}

/**
 * Fetch featured content from the database
 */
async function fetchFeaturedContent() {
  try {
    const [rows] = await pool.execute(
      `SELECT external_track_id, source, title, artist, cover_url, category
       FROM featured_tracks
       WHERE active = 1
       ORDER BY position ASC
       LIMIT 12`
    );

    return rows.map(row => ({
      id: `${row.source}:${row.external_track_id}`,
      title: row.title,
      artist: row.artist,
      image: row.cover_url,
      category: row.category,
      source: { provider: row.source, id: row.external_track_id },
    }));
  } catch (err) {
    console.error('[Explore] Error fetching featured content:', err.message);
    return [];
  }
}
