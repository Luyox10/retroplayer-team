import { request } from '../../shared/utils/api';

export function getReports(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/admin/reports?${params.toString()}`);
}

export function updateReport(id, status) {
  return request(`/api/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
