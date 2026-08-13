import { request } from '../../shared/utils/api';

export function getHome() {
  return request('/api/home');
}

export function getGenres() {
  return request('/api/genres');
}

export function getGenreTracks(genreId, limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/genres/${encodeURIComponent(genreId)}/tracks?${params.toString()}`);
}
