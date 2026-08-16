/**
 * YouTubeProvider
 * 
 * Implements ContentProvider using YouTube Data API v3.
 * 
 * Flow: YouTubeProvider -> youtubeAdapter (API calls + cache) -> youtubeNormalizer (to RetroPlayer models)
 */

import { ContentProvider } from '../ContentProvider.js';
import * as adapter from './youtubeAdapter.js';
import {
  normalizeVideoToTrack,
  normalizeChannelToArtist,
  normalizePlaylistToAlbum,
} from './youtubeNormalizer.js';

export class YouTubeProvider extends ContentProvider {
  constructor() {
    super('youtube');
  }

  async searchTracks(query, limit = 10) {
    const data = await adapter.searchVideos(query, limit);
    const tracks = (data.items || [])
      .map(normalizeVideoToTrack)
      .filter(Boolean);
    return { tracks, nextPageToken: data.nextPageToken || null };
  }

  async searchArtists(query, limit = 10) {
    const data = await adapter.searchChannels(query, limit);
    const artists = (data.items || [])
      .map(normalizeChannelToArtist)
      .filter(Boolean);
    return { artists, nextPageToken: data.nextPageToken || null };
  }

  async getTrack(externalId) {
    const item = await adapter.getVideoDetails(externalId);
    const track = normalizeVideoToTrack(item);
    if (!track) {
      const { AppError } = await import('../../utils/errors.js');
      throw new AppError('Track not found', 404, 'NOT_FOUND');
    }
    return track;
  }

  async getArtist(externalId) {
    const item = await adapter.getChannelDetails(externalId);
    const artist = normalizeChannelToArtist(item);
    if (!artist) {
      const { AppError } = await import('../../utils/errors.js');
      throw new AppError('Artist not found', 404, 'NOT_FOUND');
    }
    return artist;
  }

  async getArtistTracks(artistExternalId, limit = 10) {
    // Get channel details to know the channel name
    const channel = await adapter.getChannelDetails(artistExternalId);
    const channelName = channel?.snippet?.title || '';

    // Search for music videos by this artist
    const data = await adapter.searchVideos(`${channelName} music`, limit);
    const tracks = (data.items || [])
      .map(normalizeVideoToTrack)
      .filter(Boolean)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

    return { tracks };
  }

  async getArtistAlbums(channelId, limit = 10) {
    // Fetch playlists belonging to the artist's channel and keep the ones
    // that look like real studio albums (not live, sessions, mixes, etc.)
    const data = await adapter.getChannelPlaylists(channelId, 25);
    const channel = await adapter.getChannelDetails(channelId);
    const channelTitle = channel?.snippet?.title || null;

    const nonAlbumWords = [
      'live', 'session', 'shorts', 'mix', 'compilation', 'greatest hits',
      'radio', 'cover', 'karaoke', 'instrumental', 'interview', 'acoustic',
      'demo', 'unreleased', 'bootleg', 'tour', 'concert', 'documentary',
      'reaction', 'medley', 'station', 'podcast', 'full concert', 'music videos',
    ];

    const albums = (data.items || [])
      .filter((item) => {
        const title = (item.snippet?.title || '').toLowerCase();
        const trackCount = item.contentDetails?.itemCount || 0;
        if (trackCount < 4) return false;
        return !nonAlbumWords.some((word) => title.includes(word));
      })
      // Prioritize fuller playlists (real albums usually have more tracks)
      .sort((a, b) => (b.contentDetails?.itemCount || 0) - (a.contentDetails?.itemCount || 0))
      .map(item => normalizePlaylistToAlbum(item, channelTitle))
      .filter(Boolean)
      .slice(0, limit);

    return { albums };
  }

  async getAlbumTracks(albumExternalId, options = {}) {
    const limit = Math.min(Math.max(options.limit || 50, 1), 50);
    const pageToken = options.pageToken || '';
    const data = await adapter.getPlaylistItems(albumExternalId, limit, pageToken);
    const tracks = (data.items || [])
      .map(normalizeVideoToTrack)
      .filter(Boolean);

    return { tracks, nextPageToken: data.nextPageToken || null };
  }

  async getAlbum(externalId) {
    // YouTube playlists are treated as albums
    const { getCached, setCached } = await import('../../services/cacheService.js');
    const cacheKey = `album-v2:${externalId}`;
    const cached = await getCached('yt-album', cacheKey, 'youtube');
    if (cached) return cached;

    // Fetch actual playlist metadata (title, thumbnails, channel)
    const item = await adapter.getPlaylistDetails(externalId);
    const album = normalizePlaylistToAlbum(item, item?.snippet?.channelTitle);
    if (album) {
      await setCached('yt-album', cacheKey, album, 'youtube');
      return album;
    }

    const { AppError } = await import('../../utils/errors.js');
    throw new AppError('Album not found', 404, 'NOT_FOUND');
  }

  async getRecommended(options = {}) {
    const genre = options.genre || 'music';
    const limit = options.limit || 10;
    const query = genre === 'music' ? 'music trending' : `${genre} music`;
    const data = await adapter.searchVideos(query, limit);
    const tracks = (data.items || [])
      .map(normalizeVideoToTrack)
      .filter(Boolean);
    return { tracks };
  }

  async getTracksByGenre(genre, limit = 10) {
    const query = `${genre} music`;
    const data = await adapter.searchVideos(query, limit);
    const tracks = (data.items || [])
      .map(normalizeVideoToTrack)
      .filter(Boolean);
    return { tracks };
  }
}
