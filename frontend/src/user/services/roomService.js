import { request } from '../../shared/utils/api';

export function getFreeEnvironments() {
  return request('/api/environments/free');
}

export function getEnvironmentById(id) {
  return request(`/api/environments/${id}`);
}
