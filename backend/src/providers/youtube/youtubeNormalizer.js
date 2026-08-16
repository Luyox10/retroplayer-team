/**
 * YouTube Normalizer
 * 
 * Transforms raw YouTube API responses into RetroPlayer content models.
 * This is the ONLY place where YouTube-specific data structures are understood.
 */

import { createTrack, createArtist, createAlbum, createSource, buildContentId } from '../../models/contentModels.js';

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
export function parseISO8601Duration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [_, h, m, s] = match;
  return (parseInt(h || 0, 10) * 3600) + (parseInt(m || 0, 10) * 60) + (parseInt(s || 0, 10));
}

/**
 * Extract best available thumbnail from YouTube snippet
 */
export function extractThumbnail(snippet) {
  return snippet?.thumbnails?.high?.url
    || snippet?.thumbnails?.medium?.url
    || snippet?.thumbnails?.default?.url
    || null;
}

/**
 * Try to extract artist name from video title.
 * Common patterns: "Artist - Song Title", "Artist | Song Title"
 * Falls back to channel title.
 */
export function extractArtistFromTitle(title, channelTitle) {
  if (!title) return channelTitle || 'Unknown';

  // Remove common suffixes like (Official Video), [Lyrics], etc.
  const cleanTitle = title
    .replace(/\s*[\(\[](official\s*(music\s*)?video|lyrics|audio|lyric\s*video|official\s*audio|hd|hq|remastered|live|visualizer|video\s*oficial|v[ií]deo\s*oficial)[\)\]]/gi, '')
    .trim();

  // Try "Artist - Song" pattern
  const dashMatch = cleanTitle.match(/^(.+?)\s*[-–—]\s*.+/);
  if (dashMatch && dashMatch[1].trim().length > 0) {
    return dashMatch[1].trim();
  }

  // Try "Artist | Song" pattern
  const pipeMatch = cleanTitle.match(/^(.+?)\s*\|\s*.+/);
  if (pipeMatch && pipeMatch[1].trim().length > 0) {
    return pipeMatch[1].trim();
  }

  return channelTitle || 'Unknown';
}

/**
 * Try to extract song title from video title.
 * Strips artist prefix and common suffixes.
 */
export function extractSongTitle(title) {
  if (!title) return 'Unknown';

  // Remove common suffixes
  let clean = title
    .replace(/\s*[\(\[](official\s*(music\s*)?video|lyrics|audio|lyric\s*video|official\s*audio|hd|hq|remastered|live|visualizer|video\s*oficial|v[ií]deo\s*oficial)[\)\]]/gi, '')
    .trim();

  // Try "Artist - Song" pattern and return just the song
  const dashMatch = clean.match(/^.+?\s*[-–—]\s*(.+)/);
  if (dashMatch && dashMatch[1].trim().length > 0) {
    return dashMatch[1].trim();
  }

  // Try "Artist | Song" pattern
  const pipeMatch = clean.match(/^.+?\s*\|\s*(.+)/);
  if (pipeMatch && pipeMatch[1].trim().length > 0) {
    return pipeMatch[1].trim();
  }

  return clean || title;
}

/**
 * Normalize a YouTube video item (from search + details) into a Track
 */
export function normalizeVideoToTrack(item) {
  const videoId = typeof item.id === 'string' ? item.id : item.id?.videoId;
  if (!videoId) return null;

  const snippet = item.snippet || {};
  const contentDetails = item.contentDetails || {};
  const status = item.status || {};

  const rawTitle = snippet.title || 'Unknown';
  const channelTitle = snippet.channelTitle || null;
  const channelId = snippet.channelId || null;

  return createTrack({
    id: buildContentId('youtube', videoId),
    title: extractSongTitle(rawTitle),
    artist: extractArtistFromTitle(rawTitle, channelTitle),
    artistId: channelId ? buildContentId('youtube', channelId) : null,
    album: null,
    albumId: null,
    duration: parseISO8601Duration(contentDetails.duration),
    image: extractThumbnail(snippet),
    viewCount: Number(item.statistics?.viewCount || 0),
    source: createSource('youtube', videoId),
  });
}

/**
 * Normalize a YouTube channel item into an Artist
 */
export function normalizeChannelToArtist(item) {
  const channelId = typeof item.id === 'string' ? item.id : item.id?.channelId;
  if (!channelId) return null;

  const snippet = item.snippet || {};

  return createArtist({
    id: buildContentId('youtube', channelId),
    name: snippet.title || 'Unknown',
    image: extractThumbnail(snippet),
    description: snippet.description || null,
    subscriberCount: Number(item.statistics?.subscriberCount || 0),
    genres: [],
    source: createSource('youtube', channelId),
  });
}

/**
 * Normalize a YouTube playlist into an Album-like structure
 */
export function normalizePlaylistToAlbum(item, channelTitle = null) {
  const playlistId = typeof item.id === 'string' ? item.id : item.id?.playlistId;
  if (!playlistId) return null;

  const snippet = item.snippet || {};
  const publishedAt = snippet.publishedAt;
  const year = publishedAt ? new Date(publishedAt).getFullYear() : null;

  return createAlbum({
    id: buildContentId('youtube', playlistId),
    name: snippet.title || 'Unknown',
    artistId: snippet.channelId ? buildContentId('youtube', snippet.channelId) : null,
    artistName: channelTitle || snippet.channelTitle || null,
    year,
    image: extractThumbnail(snippet),
    source: createSource('youtube', playlistId),
  });
}
