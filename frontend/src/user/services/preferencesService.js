import { request } from '../../shared/utils/api';

export function getPreferences() {
  return request('/api/preferences');
}

export function getGenrePreferences() {
  return request('/api/preferences/genres');
}

export function updateGenrePreferences(genres) {
  return request('/api/preferences/genres', {
    method: 'PUT',
    body: JSON.stringify({ genres }),
  });
}
