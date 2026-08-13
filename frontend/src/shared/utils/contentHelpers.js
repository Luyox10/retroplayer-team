/**
 * Content Helpers
 * 
 * Utilities for working with RetroPlayer's normalized content model.
 * Provides backward-compatible mapping for components that still use
 * legacy field names (videoId, thumbnail, etc.)
 * 
 * Provider-agnostic: works with YouTube, and future providers (Audius, etc.)
 * When adding a new provider, update:
 *   - isPlayableByYouTube() to exclude non-YouTube tracks
 *   - getPlaybackInfo() to provide the right playback mechanism
 *   - No other frontend changes should be needed
 */

/**
 * Extract the provider-specific external ID from a track.
 * Works with both normalized tracks (source.id) and legacy format (externalId/videoId).
 */
export function getExternalId(track) {
  if (!track) return null;
  if (track.source?.id) return track.source.id;
  if (track.externalId) return track.externalId;
  if (track.videoId) return track.videoId;
  if (track.external_track_id) return track.external_track_id;
  // Try to extract from content ID (e.g. "youtube:abc123")
  if (track.id && track.id.includes(':')) {
    return track.id.split(':').slice(1).join(':');
  }
  return track.id || null;
}

/**
 * Get the provider name from a track.
 */
export function getProvider(track) {
  if (!track) return 'youtube';
  if (track.source?.provider) return track.source.provider;
  if (track.provider) return track.provider;
  return 'youtube';
}

/**
 * Check if a track should be played via YouTube IFrame Player.
 * Returns false for non-YouTube providers (future: Audius uses direct audio).
 */
export function isYouTubeTrack(track) {
  return getProvider(track) === 'youtube';
}

/**
 * Get the display image from a track (handles both normalized and legacy formats).
 */
export function getTrackImage(track) {
  if (!track) return null;
  return track.image || track.thumbnail || track.thumbnailUrl || track.cover_url || null;
}

/**
 * Get playback info for a track based on its provider.
 * 
 * Returns:
 *   - For YouTube: { type: 'youtube', videoId }
 *   - For future providers: { type: 'audio', url } (example)
 * 
 * This is where new provider playback types would be added.
 */
export function getPlaybackInfo(track) {
  if (!track) return null;

  const provider = getProvider(track);
  const externalId = getExternalId(track);

  if (provider === 'youtube') {
    return {
      type: 'youtube',
      videoId: externalId,
      embedUrl: `https://www.youtube.com/embed/${externalId}`,
    };
  }

  // Future providers would add their playback info here:
  // if (provider === 'audius') {
  //   return { type: 'audio', url: `https://discoveryprovider.audius.co/v1/tracks/${externalId}/stream` };
  // }

  return { type: 'youtube', videoId: externalId, embedUrl: `https://www.youtube.com/embed/${externalId}` };
}

/**
 * Prepare a normalized track for the player context.
 * The player still needs certain fields to work with the YouTube IFrame API.
 */
export function toPlayerTrack(track) {
  if (!track) return null;

  const externalId = getExternalId(track);
  const playback = getPlaybackInfo(track);

  return {
    // Normalized fields
    id: track.id,
    title: track.title || 'Unknown',
    artist: track.artist || 'Unknown',
    artistId: track.artistId || null,
    album: track.album || null,
    albumId: track.albumId || null,
    duration: track.duration || 0,
    image: getTrackImage(track),
    source: track.source || { provider: 'youtube', id: externalId },
    // Player-compatible fields
    externalId,
    videoId: playback?.videoId || externalId,
    thumbnail: getTrackImage(track),
    embedUrl: playback?.embedUrl || null,
    // Playback info for future multi-provider player
    playback,
  };
}

/**
 * Check if two tracks are the same (by content ID or external ID).
 */
export function isSameTrack(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  const idA = getExternalId(a);
  const idB = getExternalId(b);
  return idA && idB && idA === idB;
}
