import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const STATUSES = ['draft', 'published', 'hidden'];
const TYPES = ['room', 'studio', 'lounge', 'arcade'];

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

function validateEnvironment(body) {
  const { name, type, status, price, is_free, is_active } = body || {};
  if (!name || !type || !status) {
    throw new AppError('name, type and status are required', 400, 'VALIDATION_ERROR');
  }
  if (!TYPES.includes(type)) throw new AppError(`type must be one of: ${TYPES.join(', ')}`, 400, 'VALIDATION_ERROR');
  if (!STATUSES.includes(status)) throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
  return {
    name,
    description: body.description || null,
    type,
    status,
    scene_data: toJson(body.scene_data),
    image_url: body.image_url || null,
    thumbnail_url: body.thumbnail_url || null,
    price: price === undefined ? 0 : Number(price),
    is_free: is_free === true || is_free === 'true' || is_free === 1,
    is_active: is_active === undefined ? true : (is_active === true || is_active === 'true' || is_active === 1),
  };
}

export async function getEnvironments(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);

  const [rows] = await pool.execute(
    `SELECT id, name, description, type, status, image_url, thumbnail_url, price, is_free, is_active, created_at, updated_at
     FROM environments
     WHERE status = 'published' AND is_active = TRUE
     ORDER BY is_free DESC, name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    []
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM environments WHERE status = 'published' AND is_active = TRUE`
  );

  sendSuccess(res, 200, { environments: rows, meta: { total, limit, offset } });
}

export async function getFreeEnvironments(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);

  const [rows] = await pool.execute(
    `SELECT id, name, description, type, status, image_url, thumbnail_url, price, is_free, is_active, created_at, updated_at
     FROM environments
     WHERE is_free = TRUE AND status = 'published' AND is_active = TRUE
     ORDER BY name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    []
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM environments WHERE is_free = TRUE AND status = 'published' AND is_active = TRUE`
  );

  sendSuccess(res, 200, { environments: rows, meta: { total, limit, offset } });
}

export async function getEnvironmentById(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid environment ID', 400, 'VALIDATION_ERROR');

  const [rows] = await pool.execute(
    `SELECT id, name, description, type, status, scene_data, image_url, thumbnail_url, price, is_free, is_active, created_at, updated_at
     FROM environments
     WHERE id = ? AND status = 'published' AND is_active = TRUE`,
    [id]
  );

  if (rows.length === 0) throw new AppError('Environment not found', 404, 'NOT_FOUND');

  const [objects] = await pool.execute(
    `SELECT eo.id as env_object_id, eo.environment_id, eo.object_id, eo.position_x, eo.position_y, eo.position_z,
            eo.rotation_x, eo.rotation_y, eo.rotation_z, eo.scale_x, eo.scale_y, eo.scale_z,
            ro.name as object_name, ro.type as object_type, ro.image_url as object_image, ro.config as object_config
     FROM environment_objects eo
     JOIN room_objects ro ON eo.object_id = ro.id
     WHERE eo.environment_id = ? AND ro.status = 'published' AND ro.is_active = TRUE`,
    [id]
  );

  sendSuccess(res, 200, { environment: rows[0], objects });
}

export async function adminGetEnvironments(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const status = url.searchParams.get('status');
  const active = url.searchParams.get('active');

  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (active !== null && active !== undefined) { conditions.push('is_active = ?'); params.push(active === 'true' || active === '1'); }

  const [rows] = await pool.execute(
    `SELECT id, name, description, type, status, scene_data, image_url, thumbnail_url, price, is_free, is_active, created_at, updated_at
     FROM environments
     WHERE ${conditions.join(' AND ')}
     ORDER BY name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM environments WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { environments: rows, meta: { total, limit, offset } });
}

export async function adminCreateEnvironment(req, res) {
  const user = await requireAdmin(req);
  const data = validateEnvironment(req.body);

  const [result] = await pool.execute(
    `INSERT INTO environments (name, description, type, status, scene_data, image_url, thumbnail_url, price, is_free, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.description, data.type, data.status, data.scene_data, data.image_url, data.thumbnail_url, data.price, data.is_free, data.is_active, user.id]
  );

  sendSuccess(res, 201, { id: result.insertId }, 'Environment created');
}

export async function adminUpdateEnvironment(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid environment ID', 400, 'VALIDATION_ERROR');

  const body = req.body || {};
  const fields = [];
  const values = [];

  const add = (field, value, transform = x => x) => {
    if (value !== undefined) {
      fields.push(`${field} = ?`);
      values.push(transform(value));
    }
  };

  add('name', body.name);
  add('description', body.description);
  add('type', body.type, v => { if (!TYPES.includes(v)) throw new AppError('invalid type', 400, 'VALIDATION_ERROR'); return v; });
  add('status', body.status, v => { if (!STATUSES.includes(v)) throw new AppError('invalid status', 400, 'VALIDATION_ERROR'); return v; });
  add('scene_data', body.scene_data, toJson);
  add('image_url', body.image_url);
  add('thumbnail_url', body.thumbnail_url);
  add('price', body.price, Number);
  add('is_free', body.is_free, v => v === true || v === 'true' || v === 1);
  add('is_active', body.is_active, v => v === true || v === 'true' || v === 1);

  if (fields.length === 0) throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');

  values.push(id);
  const [result] = await pool.execute(
    `UPDATE environments SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) throw new AppError('Environment not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Environment updated');
}

export async function adminDeleteEnvironment(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid environment ID', 400, 'VALIDATION_ERROR');

  await pool.execute('DELETE FROM environment_objects WHERE environment_id = ?', [id]);
  const [result] = await pool.execute('DELETE FROM environments WHERE id = ?', [id]);

  if (result.affectedRows === 0) throw new AppError('Environment not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Environment deleted');
}
