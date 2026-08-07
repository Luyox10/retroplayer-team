import { request } from '../../shared/utils/api';

export function getEnvironments(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/admin/environments?${params.toString()}`);
}

export function createEnvironment(data) {
  return request('/api/admin/environments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateEnvironment(id, data) {
  return request(`/api/admin/environments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteEnvironment(id) {
  return request(`/api/admin/environments/${id}`, {
    method: 'DELETE',
  });
}
