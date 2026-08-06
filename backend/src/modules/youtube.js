import { config } from '../config/environment.js';
import { AppError } from '../utils/errors.js';
import { getCached, setCached } from '../services/cacheService.js';

const YOUTUBE_BASE_URL = config.YOUTUBE_API_URL || 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = config.YOUTUBE_API_KEY;

function buildUrl(endpoint, params) {
  const query = new URLSearchParams({ ...params, key: YOUTUBE_API_KEY });
  return `${YOUTUBE_BASE_URL}${endpoint}?${query.toString()}`;
}

function parseISO8601Duration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [_, h, m, s] = match;
  return (parseInt(h || 0, 10) * 3600) + (parseInt(m || 0, 10) * 60) + (parseInt(s || 0, 10));
}

function normalizeVideoDetails(item) {
  const thumbnail = item.snippet?.thumbnails?.high?.url
    || item.snippet?.thumbnails?.medium?.url
    || item.snippet?.thumbnails?.default?.url
    || null;

  return {
    videoId: item.id,
    title: item.snippet?.title || 'Unknown',
    description: item.snippet?.description || '',
    thumbnailUrl: thumbnail,
    channelTitle: item.snippet?.channelTitle || null,
    publishedAt: item.snippet?.publishedAt || null,
    duration: parseISO8601Duration(item.contentDetails?.duration),
    source: 'youtube',
    embeddable: item.status?.embeddable ?? true,
    embedHtml: item.player?.embedHtml || `https://www.youtube.com/embed/${item.id}`,
  };
}

async function fetchYouTube(url, cacheType, cacheKey) {
  const cached = await getCached(cacheType, cacheKey, 'youtube');
  if (cached) return cached;

  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new AppError('YouTube API unreachable', 502, 'EXTERNAL_API_ERROR');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new AppError(`YouTube API error: ${res.status} ${res.statusText} - ${text}`, 502, 'EXTERNAL_API_ERROR');
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new AppError('Invalid response from YouTube API', 502, 'EXTERNAL_API_ERROR');
  }

  if (data.error) {
    throw new AppError(`YouTube API error: ${data.error.message || 'Unknown'}`, 502, 'EXTERNAL_API_ERROR');
  }

  return data;
}

export async function searchYouTubeVideos(query, maxResults = 10) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }
  if (maxResults < 1 || maxResults > 25) {
    throw new AppError('maxResults must be between 1 and 25', 400, 'VALIDATION_ERROR');
  }

  const cacheKey = `q:${trimmed.toLowerCase()}:n${maxResults}`;
  const cached = await getCached('search', cacheKey, 'youtube');
  if (cached) return cached;

  const searchUrl = buildUrl('/search', {
    part: 'snippet',
    type: 'video',
    q: trimmed,
    maxResults: String(maxResults),
    videoEmbeddable: 'true',
  });

  const searchData = await fetchYouTube(searchUrl, 'search', cacheKey);
  const items = searchData.items || [];
  const videoIds = items.map(i => i.id?.videoId).filter(Boolean).join(',');

  if (!videoIds) {
    return [];
  }

  const detailsUrl = buildUrl('/videos', {
    part: 'snippet,status,contentDetails,player',
    id: videoIds,
  });

  const detailsData = await fetchYouTube(detailsUrl, 'details', videoIds);
  const detailsById = new Map((detailsData.items || []).map(item => [item.id, normalizeVideoDetails(item)]));

  const normalized = items
    .map(item => detailsById.get(item.id.videoId))
    .filter(Boolean);

  await setCached('search', cacheKey, normalized, 'youtube');
  return normalized;
}

export async function getYouTubeVideoDetails(videoId) {
  if (!videoId) {
    throw new AppError('Video ID is required', 400, 'VALIDATION_ERROR');
  }

  const cacheKey = `id:${videoId}`;
  const cached = await getCached('video', cacheKey, 'youtube');
  if (cached) return cached;

  const detailsUrl = buildUrl('/videos', {
    part: 'snippet,status,contentDetails,player',
    id: videoId,
  });

  const detailsData = await fetchYouTube(detailsUrl, 'video', cacheKey);
  if (!detailsData.items || detailsData.items.length === 0) {
    throw new AppError('YouTube video not found', 404, 'NOT_FOUND');
  }

  const normalized = normalizeVideoDetails(detailsData.items[0]);
  await setCached('video', cacheKey, normalized, 'youtube');
  return normalized;
}
