import { request } from '../../shared/utils/api';

export function getUsers(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/admin/users?${params.toString()}`);
}

export function updateUserStatus(id, status) {
  return request(`/api/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
