import { request } from '../../shared/utils/api';

export function getProducts(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/admin/products?${params.toString()}`);
}

export function createProduct(data) {
  return request('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProduct(id, data) {
  return request(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id) {
  return request(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}
