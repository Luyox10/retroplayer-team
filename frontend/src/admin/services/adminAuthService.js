import { request } from '../../shared/utils/api';

export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function me() {
  return request('/api/auth/me');
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}
