/**
 * Content Service
 * 
 * Central gateway for all content operations.
 * Routes requests to the appropriate provider.
 * The frontend and API controllers use this service, never providers directly.
 * 
 * Architecture:
 *   API Controllers -> contentService -> Provider (YouTube, future: Audius)
 *                                            -> Adapter (API calls + cache)
 *                                            -> Normalizer (-> RetroPlayer models)
 * 
 * Adding a new provider:
 *   1. Create src/providers/<name>/<Name>Provider.js extending ContentProvider
 *   2. Create src/providers/<name>/<name>Adapter.js (API calls + cache)
 *   3. Create src/providers/<name>/<name>Normalizer.js (-> RetroPlayer models)
 *   4. Call registerProvider('<name>', new <Name>Provider()) here or in server startup
 *   5. No changes needed to: Home, Explore, Artist, Album, Track, Playlist, Player UI
 */

import { YouTubeProvider } from '../providers/youtube/YouTubeProvider.js';
import { MusicBrainzProvider } from '../providers/musicbrainz/MusicBrainzProvider.js';
import { parseContentId } from '../models/contentModels.js';

// Provider registry
const providers = {};

// Default provider
let DEFAULT_PROVIDER = 'youtube';

/**
 * Register a content provider.
 * Call this during server startup to add providers.
 */
export function registerProvider(name, provider) {
  providers[name] = provider;
}

/**
 * Set the default provider.
 */
export function setDefaultProvider(name) {
  if (!providers[name]) {
    throw new Error(`Cannot set default provider to unknown provider: ${name}`);
  }
  DEFAULT_PROVIDER = name;
}

function getProvider(name = DEFAULT_PROVIDER) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown content provider: ${name}. Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

// Initialize built-in providers
registerProvider('youtube', new YouTubeProvider());
registerProvider('musicbrainz', new MusicBrainzProvider());

/**
 * Search for tracks across providers
 */
export async function searchTracks(query, limit = 10, providerName = DEFAULT_PROVIDER) {
  return getProvider(providerName).searchTracks(query, limit);
}

/**
 * Search for artists across providers
 */
export async function searchArtists(query, limit = 10, providerName = DEFAULT_PROVIDER) {
  return getProvider(providerName).searchArtists(query, limit);
}

/**
 * Get a track by its RetroPlayer content ID (e.g. "youtube:dQw4w9WgXcQ")
 */
export async function getTrack(contentId) {
  const { provider, id } = parseContentId(contentId);
  return getProvider(provider).getTrack(id);
}

/**
 * Get a track by provider and external ID directly
 */
export async function getTrackByExternalId(externalId, providerName = DEFAULT_PROVIDER) {
  return getProvider(providerName).getTrack(externalId);
}

/**
 * Get an artist by content ID
 */
export async function getArtist(contentId) {
  const { provider, id } = parseContentId(contentId);
  return getProvider(provider).getArtist(id);
}

/**
 * Get an artist by provider and external ID
 */
export async function getArtistByExternalId(externalId, providerName = DEFAULT_PROVIDER) {
  return getProvider(providerName).getArtist(externalId);
}

/**
 * Get tracks by artist
 */
export async function getArtistTracks(contentId, limit = 10) {
  const { provider, id } = parseContentId(contentId);
  return getProvider(provider).getArtistTracks(id, limit);
}

/**
 * Get albums by artist
 */
export async function getArtistAlbums(contentId, limit = 10) {
  const { provider, id } = parseContentId(contentId);
  return getProvider(provider).getArtistAlbums(id, limit);
}

/**
 * Get discography for an artist by name (MusicBrainz)
 */
export async function getDiscography(artistName, limit = 10) {
  return getProvider('musicbrainz').getDiscography(artistName, limit);
}

/**
 * Get a single album
 */
export async function getAlbum(contentId) {
  const { provider, id } = parseContentId(contentId);
  return getProvider(provider).getAlbum(id);
}

/**
 * Get tracks from an album
 */
export async function getAlbumTracks(contentId, options = {}) {
  const { provider, id } = parseContentId(contentId);
  return getProvider(provider).getAlbumTracks(id, options);
}

/**
 * Get recommended tracks
 */
export async function getRecommended(options = {}, providerName = DEFAULT_PROVIDER) {
  return getProvider(providerName).getRecommended(options);
}

/**
 * Get tracks by genre
 */
export async function getTracksByGenre(genre, limit = 10, providerName = DEFAULT_PROVIDER) {
  return getProvider(providerName).getTracksByGenre(genre, limit);
}

/**
 * Get the list of available providers
 */
export function getAvailableProviders() {
  return Object.keys(providers);
}

/**
 * Search across ALL registered providers simultaneously.
 * Merges results from all providers.
 * Useful when multiple providers are active.
 */
export async function searchAllProviders(query, limit = 10) {
  const providerNames = Object.keys(providers);

  const results = await Promise.allSettled(
    providerNames.map(name =>
      providers[name].searchTracks(query, limit).then(r => ({
        provider: name,
        tracks: r.tracks || [],
      }))
    )
  );

  const allTracks = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTracks.push(...result.value.tracks);
    }
  }

  return { tracks: allTracks };
}

/**
 * Get the default provider name.
 */
export function getDefaultProvider() {
  return DEFAULT_PROVIDER;
}
