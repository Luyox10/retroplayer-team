import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const CATEGORIES = ['recommended', 'retro', 'electronic', 'rock', 'spanish', 'english', 'recent'];

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

function validateFeatured(body) {
  const { external_track_id, source, title, artist, category, position } = body || {};
  if (!external_track_id || !source || !title || !artist || !category || position === undefined || position === null) {
    throw new AppError('external_track_id, source, title, artist, category and position are required', 400, 'VALIDATION_ERROR');
  }
  if (!['jamendo', 'youtube'].includes(source)) {
    throw new AppError('source must be jamendo or youtube', 400, 'VALIDATION_ERROR');
  }
  if (!CATEGORIES.includes(category)) {
    throw new AppError(`category must be one of: ${CATEGORIES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  return {
    external_track_id,
    source,
    title,
    artist,
    cover_url: body.cover_url || null,
    category,
    position: Number(position),
    active: body.active !== false && body.active !== 'false' && body.active !== 0,
  };
}

export async function getFeaturedTracks(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const category = url.searchParams.get('category') || 'recommended';
  const { limit, offset } = getPagination(url);

  if (!CATEGORIES.includes(category)) {
    throw new AppError(`category must be one of: ${CATEGORIES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const [rows] = await pool.execute(
    `SELECT id, external_track_id, source, category, title, artist, cover_url, position, active, created_at, updated_at
     FROM featured_tracks
     WHERE category = ? AND active = TRUE
     ORDER BY position ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    [category]
  );

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM featured_tracks WHERE category = ? AND active = TRUE',
    [category]
  );

  sendSuccess(res, 200, { tracks: rows, meta: { category, total, limit, offset } });
}

export async function adminGetFeaturedTracks(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const category = url.searchParams.get('category');
  const active = url.searchParams.get('active');
  const { limit, offset } = getPagination(url);

  const conditions = ['1=1'];
  const params = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (active !== null && active !== undefined) {
    conditions.push('active = ?');
    params.push(active === 'true' || active === '1');
  }

  const [rows] = await pool.execute(
    `SELECT id, external_track_id, source, category, title, artist, cover_url, position, active, created_by, created_at, updated_at
     FROM featured_tracks
     WHERE ${conditions.join(' AND ')}
     ORDER BY category ASC, position ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM featured_tracks WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { tracks: rows, meta: { category, active, total, limit, offset } });
}

export async function adminCreateFeaturedTrack(req, res) {
  const user = await requireAdmin(req);
  const data = validateFeatured(req.body);

  const [result] = await pool.execute(
    `INSERT INTO featured_tracks (external_track_id, source, category, title, artist, cover_url, position, active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.external_track_id, data.source, data.category, data.title, data.artist, data.cover_url, data.position, data.active, user.id]
  );

  sendSuccess(res, 201, { id: result.insertId }, 'Featured track created');
}

export async function adminUpdateFeaturedTrack(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) {
    throw new AppError('Invalid ID', 400, 'VALIDATION_ERROR');
  }

  const body = req.body || {};
  const fields = [];
  const values = [];

  if (body.external_track_id !== undefined) { fields.push('external_track_id = ?'); values.push(body.external_track_id); }
  if (body.source !== undefined) {
    if (!['jamendo', 'youtube'].includes(body.source)) throw new AppError('source must be jamendo or youtube', 400, 'VALIDATION_ERROR');
    fields.push('source = ?'); values.push(body.source);
  }
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.artist !== undefined) { fields.push('artist = ?'); values.push(body.artist); }
  if (body.cover_url !== undefined) { fields.push('cover_url = ?'); values.push(body.cover_url); }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) throw new AppError(`category must be one of: ${CATEGORIES.join(', ')}`, 400, 'VALIDATION_ERROR');
    fields.push('category = ?'); values.push(body.category);
  }
  if (body.position !== undefined) { fields.push('position = ?'); values.push(Number(body.position)); }
  if (body.active !== undefined) { fields.push('active = ?'); values.push(body.active === true || body.active === 'true' || body.active === 1); }

  if (fields.length === 0) throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');

  values.push(id);
  const [result] = await pool.execute(
    `UPDATE featured_tracks SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) throw new AppError('Featured track not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Featured track updated');
}

export async function adminDeleteFeaturedTrack(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid ID', 400, 'VALIDATION_ERROR');

  const [result] = await pool.execute('DELETE FROM featured_tracks WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw new AppError('Featured track not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Featured track deleted');
}
