import { request } from '../../shared/utils/api';

export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(displayName, email, username, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName, email, username, password }),
  });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function me() {
  return request('/api/auth/me');
}
