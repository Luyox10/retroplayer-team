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
      .filter(Boolean);

    return { tracks };
  }

  async getArtistAlbums(artistExternalId, limit = 10) {
    const data = await adapter.getChannelPlaylists(artistExternalId, limit);
    const channel = await adapter.getChannelDetails(artistExternalId);
    const channelTitle = channel?.snippet?.title || null;

    const albums = (data.items || [])
      .map(item => normalizePlaylistToAlbum(item, channelTitle))
      .filter(Boolean);

    return { albums };
  }

  async getAlbumTracks(albumExternalId) {
    const data = await adapter.getPlaylistItems(albumExternalId, 25);
    const tracks = (data.items || [])
      .map(normalizeVideoToTrack)
      .filter(Boolean);

    return { tracks };
  }

  async getAlbum(externalId) {
    // YouTube playlists are treated as albums
    // We need to fetch the playlist details
    const { getCached, setCached } = await import('../../services/cacheService.js');
    const cacheKey = `album:${externalId}`;
    const cached = await getCached('yt-album', cacheKey, 'youtube');
    if (cached) return cached;

    // Fetch playlist info by getting its items (which gives us the snippet)
    const data = await adapter.getPlaylistItems(externalId, 1);
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const album = normalizePlaylistToAlbum({
        id: externalId,
        snippet: {
          title: 'Playlist',
          channelId: item.snippet?.channelId,
          channelTitle: item.snippet?.channelTitle,
          thumbnails: item.snippet?.thumbnails,
          publishedAt: item.snippet?.publishedAt,
        },
      });
      if (album) {
        await setCached('yt-album', cacheKey, album, 'youtube');
        return album;
      }
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
