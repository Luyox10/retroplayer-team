import { request } from '../../shared/utils/api';

export function getFavorites(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/favorites?${params.toString()}`);
}

export function addFavorite(data) {
  return request('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function removeFavorite(source, externalTrackId) {
  return request(`/api/favorites/${encodeURIComponent(source)}/${encodeURIComponent(externalTrackId)}`, {
    method: 'DELETE',
  });
}

export function getHistory(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/history?${params.toString()}`);
}

export function addHistory(data) {
  return request('/api/history', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
