/**
 * ContentProvider - Abstract base class for all content providers.
 * 
 * Each provider (YouTube, Audius, Spotify, etc.) extends this class
 * and implements the methods below. The contentService routes calls
 * to the correct provider based on content IDs.
 * 
 * === How to add a new provider (e.g. Audius) ===
 * 
 * 1. Create directory: src/providers/audius/
 * 
 * 2. Create AudiusAdapter.js:
 *    - Low-level API calls to the Audius REST API
 *    - Use cacheService for caching responses
 *    - Example methods: searchTracks(query, limit), getTrack(trackId)
 * 
 * 3. Create audiusNormalizer.js:
 *    - Transform Audius API responses into RetroPlayer models
 *    - Use createTrack(), createArtist(), createAlbum() from contentModels.js
 *    - Map Audius fields to normalized fields:
 *        { title, artwork: { '480x480' } } -> { title, image }
 * 
 * 4. Create AudiusProvider.js:
 *    - Import AudiusAdapter and audiusNormalizer
 *    - Extend ContentProvider
 *    - Implement all methods below
 *    - Each method calls adapter -> normalizer -> return
 * 
 * 5. Register in contentService.js:
 *    import { AudiusProvider } from '../providers/audius/AudiusProvider.js';
 *    registerProvider('audius', new AudiusProvider());
 * 
 * 6. Frontend: NO changes needed!
 *    - contentHelpers.js already handles multi-provider
 *    - getPlaybackInfo() in contentHelpers.js needs one entry for Audius:
 *        if (provider === 'audius') return { type: 'audio', url: streamUrl };
 *    - Television.js would need a conditional:
 *        if (playback.type === 'youtube') -> <YouTubePlayer />
 *        if (playback.type === 'audio')   -> <AudioPlayer /> (new component)
 * 
 * 7. Database: The source field in favorites/history already supports
 *    any provider string. Content IDs use format "provider:externalId".
 * 
 * === Provider contract ===
 * 
 * All methods must return normalized RetroPlayer model objects.
 * All methods must be async.
 * Providers should use cacheService to avoid duplicate API calls.
 * Providers should handle errors gracefully (return empty results, not throw).
 */

export class ContentProvider {
  /**
   * Provider identifier (e.g. 'youtube', 'audius')
   */
  get name() {
    throw new Error('Provider must implement "name" getter');
  }

  /**
   * Search for tracks.
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<{tracks: Track[]}>}
   */
  async searchTracks(query, limit = 10) {
    throw new Error('Provider must implement searchTracks()');
  }

  /**
   * Search for artists.
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<{artists: Artist[]}>}
   */
  async searchArtists(query, limit = 10) {
    throw new Error('Provider must implement searchArtists()');
  }

  /**
   * Get a single track by provider-specific ID.
   * @param {string} externalId
   * @returns {Promise<Track>}
   */
  async getTrack(externalId) {
    throw new Error('Provider must implement getTrack()');
  }

  /**
   * Get a single artist by provider-specific ID.
   * @param {string} externalId
   * @returns {Promise<Artist>}
   */
  async getArtist(externalId) {
    throw new Error('Provider must implement getArtist()');
  }

  /**
   * Get tracks by an artist.
   * @param {string} artistExternalId
   * @param {number} limit
   * @returns {Promise<{tracks: Track[]}>}
   */
  async getArtistTracks(artistExternalId, limit = 10) {
    throw new Error('Provider must implement getArtistTracks()');
  }

  /**
   * Get albums by an artist.
   * @param {string} artistExternalId
   * @param {number} limit
   * @returns {Promise<{albums: Album[]}>}
   */
  async getArtistAlbums(artistExternalId, limit = 10) {
    throw new Error('Provider must implement getArtistAlbums()');
  }

  /**
   * Get a single album by provider-specific ID.
   * @param {string} externalId
   * @returns {Promise<Album>}
   */
  async getAlbum(externalId) {
    throw new Error('Provider must implement getAlbum()');
  }

  /**
   * Get tracks from an album.
   * @param {string} albumExternalId
   * @returns {Promise<{tracks: Track[]}>}
   */
  async getAlbumTracks(albumExternalId) {
    throw new Error('Provider must implement getAlbumTracks()');
  }

  /**
   * Get recommended tracks.
   * @param {object} options - { genre, limit, ... }
   * @returns {Promise<{tracks: Track[]}>}
   */
  async getRecommended(options = {}) {
    throw new Error('Provider must implement getRecommended()');
  }

  /**
   * Get tracks by genre.
   * @param {string} genre
   * @param {number} limit
   * @returns {Promise<{tracks: Track[]}>}
   */
  async getTracksByGenre(genre, limit = 10) {
    throw new Error('Provider must implement getTracksByGenre()');
  }
}
