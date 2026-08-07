import { request } from '../../shared/utils/api';

export function getDashboard() {
  return request('/api/admin/dashboard');
}
