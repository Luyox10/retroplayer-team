/**
 * YouTube Adapter
 * 
 * Low-level access to YouTube Data API v3.
 * Handles HTTP requests, caching, and error handling.
 * Does NOT normalize data - that's the normalizer's job.
 */

import { config } from '../../config/environment.js';
import { AppError } from '../../utils/errors.js';
import { getCached, setCached } from '../../services/cacheService.js';

const YOUTUBE_BASE_URL = config.YOUTUBE_API_URL || 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = config.YOUTUBE_API_KEY;

function buildUrl(endpoint, params) {
  const query = new URLSearchParams({ ...params, key: YOUTUBE_API_KEY });
  return `${YOUTUBE_BASE_URL}${endpoint}?${query.toString()}`;
}

async function fetchYouTube(url) {
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

async function cachedFetch(url, cacheType, cacheKey) {
  const cached = await getCached(cacheType, cacheKey, 'youtube');
  if (cached) return cached;

  const data = await fetchYouTube(url);
  await setCached(cacheType, cacheKey, data, 'youtube');
  return data;
}

/**
 * Search for videos on YouTube
 */
export async function searchVideos(query, maxResults = 10) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }
  const limit = Math.min(Math.max(maxResults, 1), 25);

  const cacheKey = `search:videos:${trimmed.toLowerCase()}:${limit}`;
  const cached = await getCached('yt-search', cacheKey, 'youtube');
  if (cached) return cached;

  const searchUrl = buildUrl('/search', {
    part: 'snippet',
    type: 'video',
    q: trimmed,
    maxResults: String(limit),
    videoEmbeddable: 'true',
    videoCategoryId: '10',
    regionCode: config.YOUTUBE_REGION_CODE,
    relevanceLanguage: config.YOUTUBE_DEFAULT_LANGUAGE,
  });

  const searchData = await fetchYouTube(searchUrl);
  const items = searchData.items || [];
  const videoIds = items.map(i => i.id?.videoId).filter(Boolean);

  if (videoIds.length === 0) {
    const result = { items: [], nextPageToken: searchData.nextPageToken || null };
    await setCached('yt-search', cacheKey, result, 'youtube');
    return result;
  }

  // Fetch full details for each video
  const detailsUrl = buildUrl('/videos', {
    part: 'snippet,status,contentDetails,statistics',
    id: videoIds.join(','),
  });

  const detailsData = await fetchYouTube(detailsUrl);
  const detailItems = (detailsData.items || []).filter(item => item.status?.embeddable !== false);

  const result = { items: detailItems, nextPageToken: searchData.nextPageToken || null };
  await setCached('yt-search', cacheKey, result, 'youtube');
  return result;
}

/**
 * Get details for a single video
 */
export async function getVideoDetails(videoId) {
  if (!videoId) {
    throw new AppError('Video ID is required', 400, 'VALIDATION_ERROR');
  }

  const cacheKey = `video:${videoId}`;
  const cached = await getCached('yt-video', cacheKey, 'youtube');
  if (cached) return cached;

  const url = buildUrl('/videos', {
    part: 'snippet,status,contentDetails,statistics',
    id: videoId,
  });

  const data = await fetchYouTube(url);
  if (!data.items || data.items.length === 0) {
    throw new AppError('YouTube video not found', 404, 'NOT_FOUND');
  }

  const item = data.items[0];
  await setCached('yt-video', cacheKey, item, 'youtube');
  return item;
}

/**
 * Search for channels on YouTube
 */
export async function searchChannels(query, maxResults = 10) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }
  const limit = Math.min(Math.max(maxResults, 1), 25);

  const cacheKey = `search:channels:${trimmed.toLowerCase()}:${limit}`;
  const cached = await getCached('yt-search', cacheKey, 'youtube');
  if (cached) return cached;

  const searchUrl = buildUrl('/search', {
    part: 'snippet',
    type: 'channel',
    q: trimmed,
    maxResults: String(limit),
    regionCode: config.YOUTUBE_REGION_CODE,
  });

  const data = await fetchYouTube(searchUrl);
  const result = { items: data.items || [], nextPageToken: data.nextPageToken || null };
  await setCached('yt-search', cacheKey, result, 'youtube');
  return result;
}

/**
 * Get channel details
 */
export async function getChannelDetails(channelId) {
  if (!channelId) {
    throw new AppError('Channel ID is required', 400, 'VALIDATION_ERROR');
  }

  const cacheKey = `channel:${channelId}`;
  const cached = await getCached('yt-channel', cacheKey, 'youtube');
  if (cached) return cached;

  const url = buildUrl('/channels', {
    part: 'snippet,contentDetails,statistics',
    id: channelId,
  });

  const data = await fetchYouTube(url);
  if (!data.items || data.items.length === 0) {
    throw new AppError('YouTube channel not found', 404, 'NOT_FOUND');
  }

  const item = data.items[0];
  await setCached('yt-channel', cacheKey, item, 'youtube');
  return item;
}

/**
 * Get playlists for a channel (used as "albums")
 */
export async function getChannelPlaylists(channelId, maxResults = 10) {
  if (!channelId) {
    throw new AppError('Channel ID is required', 400, 'VALIDATION_ERROR');
  }
  const limit = Math.min(Math.max(maxResults, 1), 25);

  const cacheKey = `playlists:${channelId}:${limit}`;
  const cached = await getCached('yt-playlists', cacheKey, 'youtube');
  if (cached) return cached;

  const url = buildUrl('/playlists', {
    part: 'snippet,contentDetails',
    channelId,
    maxResults: String(limit),
  });

  const data = await fetchYouTube(url);
  const result = { items: data.items || [], nextPageToken: data.nextPageToken || null };
  await setCached('yt-playlists', cacheKey, result, 'youtube');
  return result;
}

/**
 * Get details for a single playlist (used for album metadata)
 */
export async function getPlaylistDetails(playlistId) {
  if (!playlistId) {
    throw new AppError('Playlist ID is required', 400, 'VALIDATION_ERROR');
  }

  const cacheKey = `playlist:${playlistId}`;
  const cached = await getCached('yt-playlist', cacheKey, 'youtube');
  if (cached) return cached;

  const url = buildUrl('/playlists', {
    part: 'snippet',
    id: playlistId,
  });

  const data = await fetchYouTube(url);
  const item = data.items?.[0];
  if (!item) {
    throw new AppError('YouTube playlist not found', 404, 'NOT_FOUND');
  }

  await setCached('yt-playlist', cacheKey, item, 'youtube');
  return item;
}

/**
 * Get items from a playlist (used for album tracks)
 */
export async function getPlaylistItems(playlistId, maxResults = 50, pageToken = '') {
  if (!playlistId) {
    throw new AppError('Playlist ID is required', 400, 'VALIDATION_ERROR');
  }
  const limit = Math.min(Math.max(maxResults, 1), 50);

  const cacheKey = `playlist-items:${playlistId}:${limit}:${pageToken}`;
  const cached = await getCached('yt-playlist', cacheKey, 'youtube');
  if (cached) return cached;

  const params = {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: String(limit),
  };
  if (pageToken) params.pageToken = pageToken;

  const url = buildUrl('/playlistItems', params);

  const data = await fetchYouTube(url);
  const items = data.items || [];

  // Get full video details for playlist items
  const videoIds = items.map(i => i.contentDetails?.videoId).filter(Boolean);
  if (videoIds.length === 0) {
    const result = { items: [], nextPageToken: data.nextPageToken || null };
    await setCached('yt-playlist', cacheKey, result, 'youtube');
    return result;
  }

  const detailsUrl = buildUrl('/videos', {
    part: 'snippet,status,contentDetails,statistics',
    id: videoIds.join(','),
  });

  const detailsData = await fetchYouTube(detailsUrl);
  const validDetails = (detailsData.items || []).filter(
    item =>
      item.status?.embeddable !== false &&
      item.status?.privacyStatus !== 'private'
  );
  const detailsById = new Map(validDetails.map(v => [v.id, v]));

  // Preserve playlist order and position
  const detailItems = items.map((plItem, idx) => {
    const videoId = plItem.contentDetails?.videoId;
    const detail = detailsById.get(videoId);
    if (!detail) return null;
    detail.position = plItem.snippet?.position ?? idx;
    return detail;
  }).filter(Boolean);

  const result = { items: detailItems, nextPageToken: data.nextPageToken || null };
  await setCached('yt-playlist', cacheKey, result, 'youtube');
  return result;
}
