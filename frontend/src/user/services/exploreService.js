import { request } from '../../shared/utils/api';

export function searchTracks(query, limit = 20, offset = 0) {
  const params = new URLSearchParams({ q: query || '', limit: String(limit), offset: String(offset) });
  return request(`/api/explore?${params.toString()}`);
}

export function getRecommended(limit = 20) {
  return request(`/api/explore/recommended?limit=${limit}`);
}

export function getTrack(externalId) {
  return request(`/api/explore/videos/${encodeURIComponent(externalId)}`);
}
