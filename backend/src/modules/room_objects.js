import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const STATUSES = ['draft', 'published', 'hidden'];
const TYPES = ['television', 'turntable', 'lamp', 'visualizer', 'speaker', 'furniture', 'decoration'];

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

function validateRoomObject(body) {
  const { name, type, status, price, is_free, is_active } = body || {};
  if (!name || !type || !status) throw new AppError('name, type and status are required', 400, 'VALIDATION_ERROR');
  if (!TYPES.includes(type)) throw new AppError(`type must be one of: ${TYPES.join(', ')}`, 400, 'VALIDATION_ERROR');
  if (!STATUSES.includes(status)) throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
  return {
    name,
    description: body.description || null,
    type,
    status,
    config: toJson(body.config),
    model_url: body.model_url || null,
    image_url: body.image_url || null,
    price: price === undefined ? 0 : Number(price),
    is_free: is_free === true || is_free === 'true' || is_free === 1,
    is_active: is_active === undefined ? true : (is_active === true || is_active === 'true' || is_active === 1),
  };
}

export async function getRoomObjects(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const type = url.searchParams.get('type');

  const conditions = [`status = 'published'`, `is_active = TRUE`];
  const params = [];
  if (type) { conditions.push('type = ?'); params.push(type); }

  const [rows] = await pool.execute(
    `SELECT id, name, type, description, status, model_url, image_url, config, price, is_free, is_active, created_at, updated_at
     FROM room_objects
     WHERE ${conditions.join(' AND ')}
     ORDER BY name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM room_objects WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { objects: rows, meta: { total, limit, offset } });
}

export async function getRoomObjectById(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid object ID', 400, 'VALIDATION_ERROR');

  const [rows] = await pool.execute(
    `SELECT id, name, type, description, status, model_url, image_url, config, price, is_free, is_active, created_at, updated_at
     FROM room_objects
     WHERE id = ? AND status = 'published' AND is_active = TRUE`,
    [id]
  );

  if (rows.length === 0) throw new AppError('Room object not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, { object: rows[0] });
}

export async function adminGetRoomObjects(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const active = url.searchParams.get('active');

  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (type) { conditions.push('type = ?'); params.push(type); }
  if (active !== null && active !== undefined) { conditions.push('is_active = ?'); params.push(active === 'true' || active === '1'); }

  const [rows] = await pool.execute(
    `SELECT id, name, type, description, status, model_url, image_url, config, price, is_free, is_active, created_at, updated_at
     FROM room_objects
     WHERE ${conditions.join(' AND ')}
     ORDER BY name ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM room_objects WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { objects: rows, meta: { total, limit, offset } });
}

export async function adminCreateRoomObject(req, res) {
  const user = await requireAdmin(req);
  const data = validateRoomObject(req.body);

  const [result] = await pool.execute(
    `INSERT INTO room_objects (name, type, description, status, model_url, image_url, config, price, is_free, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.type, data.description, data.status, data.model_url, data.image_url, data.config, data.price, data.is_free, data.is_active, user.id]
  );

  sendSuccess(res, 201, { id: result.insertId }, 'Room object created');
}

export async function adminUpdateRoomObject(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid object ID', 400, 'VALIDATION_ERROR');

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
  add('model_url', body.model_url);
  add('image_url', body.image_url);
  add('config', body.config, toJson);
  add('price', body.price, Number);
  add('is_free', body.is_free, v => v === true || v === 'true' || v === 1);
  add('is_active', body.is_active, v => v === true || v === 'true' || v === 1);

  if (fields.length === 0) throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');

  values.push(id);
  const [result] = await pool.execute(
    `UPDATE room_objects SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) throw new AppError('Room object not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Room object updated');
}

export async function adminDeleteRoomObject(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid object ID', 400, 'VALIDATION_ERROR');

  await pool.execute('DELETE FROM environment_objects WHERE object_id = ?', [id]);
  const [result] = await pool.execute('DELETE FROM room_objects WHERE id = ?', [id]);

  if (result.affectedRows === 0) throw new AppError('Room object not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Room object deleted');
}
