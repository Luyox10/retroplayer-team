/**
 * RetroPlayer Content Models
 * 
 * Normalized data structures that the application works with.
 * These are independent of any content provider (YouTube, Audius, etc.)
 */

/**
 * @typedef {Object} Artist
 * @property {string} id - Internal RetroPlayer ID (provider:externalId)
 * @property {string} name
 * @property {string|null} image
 * @property {string|null} description
 * @property {string[]} genres
 * @property {ContentSource} source
 */
export function createArtist({ id, name, image = null, description = null, genres = [], source }) {
  return { id, name, image, description, genres, source };
}

/**
 * @typedef {Object} Album
 * @property {string} id
 * @property {string} name
 * @property {string|null} artistId
 * @property {string|null} artistName
 * @property {number|null} year
 * @property {string|null} image
 * @property {ContentSource} source
 */
export function createAlbum({ id, name, artistId = null, artistName = null, year = null, image = null, source }) {
  return { id, name, artistId, artistName, year, image, source };
}

/**
 * @typedef {Object} Track
 * @property {string} id - Internal RetroPlayer ID (provider:externalId)
 * @property {string} title
 * @property {string|null} artist - Artist name
 * @property {string|null} artistId
 * @property {string|null} album
 * @property {string|null} albumId
 * @property {number} duration - Duration in seconds
 * @property {string|null} image - Thumbnail/cover URL
 * @property {ContentSource} source
 */
export function createTrack({ id, title, artist = null, artistId = null, album = null, albumId = null, duration = 0, image = null, viewCount = 0, source }) {
  return { id, title, artist, artistId, album, albumId, duration, image, viewCount, source };
}

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {string|null} image
 * @property {Track[]} tracks
 * @property {ContentSource} source
 */
export function createPlaylist({ id, name, description = null, image = null, tracks = [], source }) {
  return { id, name, description, image, tracks, source };
}

/**
 * @typedef {Object} Genre
 * @property {string} id - Slug (e.g. "classic-rock")
 * @property {string} name - Display name (e.g. "Classic Rock")
 * @property {string|null} image
 */
export function createGenre({ id, name, image = null }) {
  return { id, name, image };
}

/**
 * @typedef {Object} ContentSource
 * @property {string} provider - e.g. "youtube", "audius"
 * @property {string} id - External provider-specific ID
 */
export function createSource(provider, id) {
  return { provider, id };
}

/**
 * Build a RetroPlayer internal ID from provider + external ID
 */
export function buildContentId(provider, externalId) {
  return `${provider}:${externalId}`;
}

/**
 * Parse a RetroPlayer internal ID into provider + external ID
 */
export function parseContentId(contentId) {
  const idx = contentId.indexOf(':');
  if (idx === -1) return { provider: 'youtube', id: contentId };
  return { provider: contentId.substring(0, idx), id: contentId.substring(idx + 1) };
}
