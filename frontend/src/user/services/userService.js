import { request } from '../../shared/utils/api';

export function getProfile() {
  return request('/api/profile');
}

export function updateProfile(displayName, avatarUrl) {
  return request('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
  });
}
