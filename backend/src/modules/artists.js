import * as contentService from '../services/contentService.js';
import { generateTopTracks } from '../services/rankingService.js';
import { parseContentId } from '../models/contentModels.js';
import { getCached, setCached } from '../services/cacheService.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function parseLimit(url) {
  const raw = url.searchParams.get('limit');
  const value = raw ? parseInt(raw, 10) : 10;
  return Number.isNaN(value) ? 10 : Math.min(Math.max(value, 1), 25);
}

function extractArtistId(req) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/artists/:id -> parts = ['api', 'artists', ':id'] or ['api', 'artists', ':id', 'tracks']
  const rawId = parts[2] ? decodeURIComponent(parts[2]) : undefined;
  if (!rawId) throw new AppError('Artist ID is required', 400, 'VALIDATION_ERROR');
  return rawId;
}

export async function getArtist(req, res) {
  const artistId = extractArtistId(req);
  const artist = await contentService.getArtist(artistId);
  sendSuccess(res, 200, { artist });
}

export async function getArtistTracks(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const artistId = extractArtistId(req);
  const limit = parseLimit(url);

  const { tracks } = await contentService.getArtistTracks(artistId, limit);
  sendSuccess(res, 200, { tracks });
}

export async function getArtistAlbums(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const artistId = extractArtistId(req);
  const limit = parseLimit(url);

  const { albums } = await contentService.getArtistAlbums(artistId, limit);
  sendSuccess(res, 200, { albums });
}

/**
 * GET /api/artists/:id/top
 * 
 * Returns the Top 10 tracks for an artist using the ranking service.
 * 
 * Flow:
 *   1. Get artist details (name, channel ID)
 *   2. Search for artist's tracks (larger pool, e.g. 25)
 *   3. Score each track with calculateTrackScore
 *   4. Deduplicate similar titles
 *   5. Sort by score
 *   6. Return top 10
 */
export async function getArtistTop(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const artistId = extractArtistId(req);
  const limit = parseLimit(url);

  // Check cache first
  const cacheKey = `artist-top:${artistId}:${limit}`;
  const cached = await getCached('ranking', cacheKey, 'retroplayer', 3600);
  if (cached) {
    sendSuccess(res, 200, { tracks: cached });
    return;
  }

  // Get artist info
  const artist = await contentService.getArtist(artistId);
  const { provider, id: channelId } = parseContentId(artistId);

  // Search for a larger pool of tracks to rank from
  const { tracks: rawTracks } = await contentService.getArtistTracks(artistId, 25);

  // Also search by artist name for broader coverage
  let extraTracks = [];
  try {
    const { tracks } = await contentService.searchTracks(`${artist.name} official music video`, 15);
    extraTracks = tracks;
  } catch {
    // Non-critical, continue with what we have
  }

  // Combine all tracks
  const allTracks N[...rawTracks, ...extraTracks];
limit
  // Generate top 10 using ranking service
  let topTracks = generateTopTracks(allTracks, artist.name, channelId, 10);

  // Sort by view count (most viewed first)
  topTracks.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  // Cache for 1 hour
  await setCached('ranking', cacheKey, topTracks, 'retroplayer', 3600);

  sendSuccess(res, 200, { tracks: topTracks });
}
