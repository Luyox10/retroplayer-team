import { request } from '../../shared/utils/api';

export function getFeatured(category = 'recommended', limit = 20, offset = 0) {
  const params = new URLSearchParams({ category, limit: String(limit), offset: String(offset) });
  return request(`/api/featured-tracks?${params.toString()}`);
}
