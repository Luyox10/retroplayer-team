import { request } from '../../shared/utils/api';

export function getRoomObjects(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/admin/room-objects?${params.toString()}`);
}

export function createRoomObject(data) {
  return request('/api/admin/room-objects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRoomObject(id, data) {
  return request(`/api/admin/room-objects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteRoomObject(id) {
  return request(`/api/admin/room-objects/${id}`, {
    method: 'DELETE',
  });
}
