/**
 * Content Service (Frontend)
 * 
 * Central service for all music content operations.
 * Works with RetroPlayer's normalized content model.
 * The frontend should use this service for all content needs.
 */

import { request } from '../../shared/utils/api';

// --- Search ---

export function search(query, limit = 10) {
  const params = new URLSearchParams({ q: query || '', limit: String(limit) });
  return request(`/api/search?${params.toString()}`);
}

export function searchTracks(query, limit = 10) {
  const params = new URLSearchParams({ q: query || '', limit: String(limit) });
  return request(`/api/explore?${params.toString()}`);
}

// --- Tracks ---

export function getTrack(trackId) {
  return request(`/api/tracks/${encodeURIComponent(trackId)}`);
}

export function getTrackByExternalId(externalId) {
  return request(`/api/explore/videos/${encodeURIComponent(externalId)}`);
}

// --- Artists ---

export function getArtist(artistId) {
  return request(`/api/artists/${encodeURIComponent(artistId)}`);
}

export function getArtistTracks(artistId, limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/artists/${encodeURIComponent(artistId)}/tracks?${params.toString()}`);
}

export function getArtistAlbums(artistId, limit = 10, artistName = '') {
  const params = new URLSearchParams({ limit: String(limit) });
  if (artistName) params.set('artistName', artistName);
  return request(`/api/artists/${encodeURIComponent(artistId)}/albums?${params.toString()}`);
}

export function getArtistTop(artistId, limit = 10) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  return request(`/api/artists/${encodeURIComponent(artistId)}/top?${params.toString()}`);
}

// --- Albums ---

export function getAlbum(albumId) {
  return request(`/api/albums/${encodeURIComponent(albumId)}`);
}

export function getAlbumTracks(albumId) {
  return request(`/api/albums/${encodeURIComponent(albumId)}/tracks`);
}

// --- Recommendations ---

export function getRecommended(limit = 10) {
  return request(`/api/explore/recommended?limit=${limit}`);
}
