import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const TYPES = ['environment', 'object', 'subscription', 'bundle'];

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function getPagination(url) {
  const rawLimit = url.searchParams.get('limit');
  const rawOffset = url.searchParams.get('offset');
  const limit = Math.min(parseInt(rawLimit || '20', 10) || 20, 100);
  const offset = Math.max(parseInt(rawOffset || '0', 10) || 0, 0);
  return { limit, offset };
}

function toJson(value) {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function validateProduct(body) {
  const { name, type, price, currency } = body || {};
  if (!name || !type || price === undefined || price === null) {
    throw new AppError('name, type and price are required', 400, 'VALIDATION_ERROR');
  }
  if (!TYPES.includes(type)) {
    throw new AppError(`type must be one of: ${TYPES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  return {
    name,
    type,
    description: body.description || null,
    price: Number(price),
    currency: currency || 'USD',
    image_url: body.image_url || null,
    stock: body.stock === undefined ? null : Number(body.stock),
    metadata: toJson(body.metadata),
    is_active: body.is_active === undefined ? true : (body.is_active === true || body.is_active === 'true' || body.is_active === 1),
  };
}

export async function getProducts(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const type = url.searchParams.get('type');

  const conditions = ['is_active = TRUE'];
  const params = [];
  if (type) { conditions.push('type = ?'); params.push(type); }

  const [rows] = await pool.execute(
    `SELECT id, name, type, description, price, currency, image_url, stock, is_active, created_at, updated_at
     FROM products
     WHERE ${conditions.join(' AND ')}
     ORDER BY name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { products: rows, meta: { total, limit, offset } });
}

export async function getProductById(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid product ID', 400, 'VALIDATION_ERROR');

  const [rows] = await pool.execute(
    `SELECT id, name, type, description, price, currency, image_url, stock, is_active, created_at, updated_at
     FROM products
     WHERE id = ? AND is_active = TRUE`,
    [id]
  );

  if (rows.length === 0) throw new AppError('Product not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, { product: rows[0] });
}

export async function adminGetProducts(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const type = url.searchParams.get('type');

  const conditions = ['1=1'];
  const params = [];
  if (type) { conditions.push('type = ?'); params.push(type); }

  const [rows] = await pool.execute(
    `SELECT id, name, type, description, price, currency, image_url, stock, metadata, is_active, created_at, updated_at
     FROM products
     WHERE ${conditions.join(' AND ')}
     ORDER BY name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { products: rows, meta: { total, limit, offset } });
}

export async function adminCreateProduct(req, res) {
  await requireAdmin(req);
  const data = validateProduct(req.body);

  const [result] = await pool.execute(
    `INSERT INTO products (name, type, description, price, currency, image_url, stock, metadata, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.type, data.description, data.price, data.currency, data.image_url, data.stock, data.metadata, data.is_active]
  );

  sendSuccess(res, 201, { id: result.insertId }, 'Product created');
}

export async function adminUpdateProduct(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid product ID', 400, 'VALIDATION_ERROR');

  const body = req.body || {};
  const fields = [];
  const values = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.type !== undefined) { fields.push('type = ?'); values.push(body.type); }
  if (body.price !== undefined) { fields.push('price = ?'); values.push(Number(body.price)); }
  if (body.currency !== undefined) { fields.push('currency = ?'); values.push(body.currency); }
  if (body.image_url !== undefined) { fields.push('image_url = ?'); values.push(body.image_url); }
  if (body.stock !== undefined) { fields.push('stock = ?'); values.push(Number(body.stock)); }
  if (body.metadata !== undefined) { fields.push('metadata = ?'); values.push(toJson(body.metadata)); }
  if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active === true || body.is_active === 'true' || body.is_active === 1); }

  if (fields.length === 0) throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');

  values.push(id);
  const [result] = await pool.execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) throw new AppError('Product not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Product updated');
}

export async function adminDeleteProduct(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid product ID', 400, 'VALIDATION_ERROR');

  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw new AppError('Product not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Product deleted');
}
