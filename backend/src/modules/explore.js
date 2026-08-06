import { searchJamendo, getJamendoTrackById, getRecommendedJamendo } from './jamendo.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function parseLimit(url) {
  const raw = url.searchParams.get('limit');
  const value = raw ? parseInt(raw, 10) : 20;
  return Number.isNaN(value) ? 20 : Math.min(Math.max(value, 1), 50);
}

function parseOffset(url) {
  const raw = url.searchParams.get('offset');
  const value = raw ? parseInt(raw, 10) : 0;
  return Number.isNaN(value) ? 0 : Math.max(value, 0);
}

export async function search(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const query = url.searchParams.get('q') || '';
  const limit = parseLimit(url);
  const offset = parseOffset(url);

  const tracks = await searchJamendo(query, limit, offset);
  sendSuccess(res, 200, {
    tracks,
    meta: {
      query: query.trim(),
      limit,
      offset,
      source: 'jamendo',
      totalFetched: tracks.length,
    },
  });
}

export async function getTrack(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  const externalId = parts[parts.length - 1];

  if (!externalId) {
    throw new AppError('Track ID is required', 400, 'VALIDATION_ERROR');
  }

  const track = await getJamendoTrackById(externalId);
  sendSuccess(res, 200, { track, source: 'jamendo' });
}

export async function getRecommended(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const limit = parseLimit(url);

  const tracks = await getRecommendedJamendo(limit);
  sendSuccess(res, 200, {
    tracks,
    meta: {
      limit,
      source: 'jamendo',
      totalFetched: tracks.length,
    },
  });
}
