import { searchYouTubeVideos, getYouTubeVideoDetails } from './youtube.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function parseLimit(url) {
  const raw = url.searchParams.get('limit');
  const value = raw ? parseInt(raw, 10) : 20;
  return Number.isNaN(value) ? 20 : Math.min(Math.max(value, 1), 25);
}

function normalizeYouTubeTrack(raw) {
  return {
    provider: 'youtube',
    source: 'youtube',
    externalId: raw.videoId,
    videoId: raw.videoId,
    title: raw.title,
    artist: raw.channelTitle,
    channelTitle: raw.channelTitle,
    thumbnail: raw.thumbnailUrl,
    thumbnailUrl: raw.thumbnailUrl,
    description: raw.description,
    publishedAt: raw.publishedAt,
    duration: raw.duration,
    type: 'video',
    embedUrl: `https://www.youtube.com/embed/${raw.videoId}`,
    embeddable: raw.embeddable,
  };
}

export async function search(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const query = url.searchParams.get('q') || '';
  const limit = parseLimit(url);

  if (!query.trim()) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }

  const { results, nextPageToken } = await searchYouTubeVideos(query, limit);
  const tracks = results.map(normalizeYouTubeTrack);

  sendSuccess(res, 200, {
    tracks,
    meta: {
      query: query.trim(),
      limit,
      source: 'youtube',
      totalFetched: tracks.length,
      nextPageToken,
    },
  });
}

export async function getTrack(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  const externalId = parts[parts.length - 1];

  if (!externalId) {
    throw new AppError('Video ID is required', 400, 'VALIDATION_ERROR');
  }

  const raw = await getYouTubeVideoDetails(externalId);
  const track = normalizeYouTubeTrack(raw);

  sendSuccess(res, 200, { track, source: 'youtube' });
}

export async function getRecommended(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const limit = parseLimit(url);

  const { results, nextPageToken } = await searchYouTubeVideos('music', limit);
  const tracks = results.map(normalizeYouTubeTrack);

  sendSuccess(res, 200, {
    tracks,
    meta: {
      query: 'music',
      limit,
      source: 'youtube',
      totalFetched: tracks.length,
      nextPageToken,
    },
  });
}
