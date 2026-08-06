import { config } from '../config/environment.js';
import { AppError } from '../utils/errors.js';
import { getCached, setCached } from '../services/cacheService.js';

const JAMENDO_BASE_URL = config.JAMENDO_API_URL || 'https://api.jamendo.com/v3.0';
const CLIENT_ID = config.JAMENDO_CLIENT_ID;

function buildUrl(endpoint, params) {
  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    format: 'json',
    ...params,
  });
  return `${JAMENDO_BASE_URL}${endpoint}?${query.toString()}`;
}

function normalizeTrack(item) {
  return {
    externalId: String(item.id),
    title: item.name || 'Unknown Title',
    artist: item.artist_name || 'Unknown Artist',
    album: item.album_name || null,
    duration: Number(item.duration) || 0,
    audioUrl: item.audio || null,
    downloadUrl: item.audio_download || null,
    thumbnailUrl: item.album_image || item.image || null,
    url: item.shareurl || item.shorturl || null,
    license: item.license_ccurl || item.license || 'https://creativecommons.org/licenses/',
    source: 'jamendo',
    tags: (item.musicinfo && Array.isArray(item.musicinfo.tags) ? item.musicinfo.tags : []),
  };
}

async function fetchJamendo(endpoint, params, cacheType, cacheKey) {
  const cached = await getCached(cacheType, cacheKey);
  if (cached) return cached;

  const url = buildUrl(endpoint, params);
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new AppError('Jamendo API unreachable', 502, 'EXTERNAL_API_ERROR');
  }

  if (!res.ok) {
    throw new AppError(`Jamendo API error: ${res.status} ${res.statusText}`, 502, 'EXTERNAL_API_ERROR');
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new AppError('Invalid response from Jamendo API', 502, 'EXTERNAL_API_ERROR');
  }

  if (!data || data.headers?.status !== 'success' || !Array.isArray(data.results)) {
    throw new AppError('Unexpected Jamendo API response', 502, 'EXTERNAL_API_ERROR');
  }

  const normalized = data.results.map(normalizeTrack);
  await setCached(cacheType, cacheKey, normalized);
  return normalized;
}

export async function searchJamendo(query, limit = 20, offset = 0) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }
  if (limit < 1 || limit > 50) {
    throw new AppError('Limit must be between 1 and 50', 400, 'VALIDATION_ERROR');
  }
  if (offset < 0) {
    throw new AppError('Offset must be >= 0', 400, 'VALIDATION_ERROR');
  }
  const cacheKey = `q:${trimmed.toLowerCase()}:l${limit}:o${offset}`;
  return fetchJamendo('/tracks', { search: trimmed, limit: String(limit), offset: String(offset) }, 'search', cacheKey);
}

export async function getJamendoTrackById(externalId) {
  if (!externalId) {
    throw new AppError('Track ID is required', 400, 'VALIDATION_ERROR');
  }

  const cacheKey = `id:${externalId}`;
  const cached = await getCached('track', cacheKey);
  if (cached) return cached;

  const url = buildUrl('/tracks', { 'id[]': externalId });
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new AppError('Jamendo API unreachable', 502, 'EXTERNAL_API_ERROR');
  }

  if (!res.ok) {
    throw new AppError(`Jamendo API error: ${res.status} ${res.statusText}`, 502, 'EXTERNAL_API_ERROR');
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new AppError('Invalid response from Jamendo API', 502, 'EXTERNAL_API_ERROR');
  }

  if (!data || data.headers?.status !== 'success' || !Array.isArray(data.results)) {
    throw new AppError('Unexpected Jamendo API response', 502, 'EXTERNAL_API_ERROR');
  }

  if (data.results.length === 0) {
    throw new AppError('Track not found', 404, 'NOT_FOUND');
  }

  const normalized = normalizeTrack(data.results[0]);
  await setCached('track', cacheKey, normalized);
  return normalized;
}

export async function getRecommendedJamendo(limit = 20) {
  if (limit < 1 || limit > 50) {
    throw new AppError('Limit must be between 1 and 50', 400, 'VALIDATION_ERROR');
  }
  const cacheKey = `recommended:l${limit}`;
  return fetchJamendo('/tracks', { order: 'popularity_total', search: 'rock', limit: String(limit), offset: '0' }, 'recommended', cacheKey);
}
