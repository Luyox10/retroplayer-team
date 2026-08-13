import * as contentService from '../services/contentService.js';
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

export async function searchAll(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const query = url.searchParams.get('q') || '';
  const limit = parseLimit(url);

  if (!query.trim()) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }

  // Search tracks and artists in parallel
  const [trackResults, artistResults] = await Promise.all([
    contentService.searchTracks(query, limit),
    contentService.searchArtists(query, limit),
  ]);

  sendSuccess(res, 200, {
    tracks: trackResults.tracks,
    artists: artistResults.artists,
    meta: {
      query: query.trim(),
      limit,
    },
  });
}

export async function searchTracksOnly(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const query = url.searchParams.get('q') || '';
  const limit = parseLimit(url);

  if (!query.trim()) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }

  const { tracks, nextPageToken } = await contentService.searchTracks(query, limit);

  sendSuccess(res, 200, {
    tracks,
    meta: {
      query: query.trim(),
      limit,
      totalFetched: tracks.length,
      nextPageToken,
    },
  });
}
