import { request } from '../../shared/utils/api';

export function getProducts(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/products?${params.toString()}`);
}

export function createOrder(productId) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId }),
  });
}

export function getOrders(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/api/orders?${params.toString()}`);
}
