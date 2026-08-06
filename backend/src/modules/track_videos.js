import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getYouTubeVideoDetails } from './youtube.js';

function toBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

async function getTrackVideoById(id) {
  const [rows] = await pool.execute(
    `SELECT id, provider, external_track_id, video_id, title, thumbnail_url, duration, is_verified, is_active, verified_by, created_at, updated_at
     FROM track_videos
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getTrackVideo(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  const provider = parts[2];
  const externalTrackId = parts[3];

  if (!provider || !externalTrackId) {
    throw new AppError('Provider and external track ID are required', 400, 'VALIDATION_ERROR');
  }

  const [rows] = await pool.execute(
    `SELECT id, provider, external_track_id, video_id, title, thumbnail_url, duration, is_verified, is_active, verified_by, created_at, updated_at
     FROM track_videos
     WHERE provider = ? AND external_track_id = ? AND is_verified = TRUE AND is_active = TRUE
     ORDER BY created_at DESC
     LIMIT 1`,
    [provider, externalTrackId]
  );

  if (rows.length === 0) {
    throw new AppError('No verified video found for this track', 404, 'NOT_FOUND');
  }

  sendSuccess(res, 200, { video: rows[0] });
}

export async function createTrackVideo(req, res) {
  const user = await requireAdmin(req);
  const { provider, external_track_id, video_id, title, thumbnail_url, duration, is_verified } = req.body || {};

  if (!provider || !external_track_id || !video_id) {
    throw new AppError('provider, external_track_id and video_id are required', 400, 'VALIDATION_ERROR');
  }

  if (provider === 'youtube') {
    await getYouTubeVideoDetails(video_id);
  }

  const [existing] = await pool.execute(
    'SELECT id FROM track_videos WHERE provider = ? AND external_track_id = ? AND video_id = ? LIMIT 1',
    [provider, external_track_id, video_id]
  );
  if (existing.length > 0) {
    throw new AppError('Video association already exists', 409, 'CONFLICT');
  }

  const verified = toBoolean(is_verified);
  const [result] = await pool.execute(
    `INSERT INTO track_videos (provider, external_track_id, video_id, title, thumbnail_url, duration, is_verified, is_active, verified_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [provider, external_track_id, video_id, title || null, thumbnail_url || null, duration || 0, verified, true, user.id]
  );

  const video = await getTrackVideoById(result.insertId);
  sendSuccess(res, 201, { video }, 'Track video association created');
}

export async function updateTrackVideo(req, res) {
  const user = await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError('Invalid video association ID', 400, 'VALIDATION_ERROR');
  }

  const existing = await getTrackVideoById(id);
  if (!existing) {
    throw new AppError('Track video not found', 404, 'NOT_FOUND');
  }

  const { title, thumbnail_url, duration, is_verified, is_active } = req.body || {};
  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push('title = ?');
    values.push(title);
  }
  if (thumbnail_url !== undefined) {
    fields.push('thumbnail_url = ?');
    values.push(thumbnail_url);
  }
  if (duration !== undefined) {
    fields.push('duration = ?');
    values.push(duration);
  }
  if (is_verified !== undefined) {
    fields.push('is_verified = ?');
    values.push(toBoolean(is_verified));
  }
  if (is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(toBoolean(is_active));
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');
  }

  values.push(user.id, id);
  await pool.execute(
    `UPDATE track_videos SET ${fields.join(', ')}, verified_by = ? WHERE id = ?`,
    values
  );

  const video = await getTrackVideoById(id);
  sendSuccess(res, 200, { video });
}

export async function deleteTrackVideo(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError('Invalid video association ID', 400, 'VALIDATION_ERROR');
  }

  const existing = await getTrackVideoById(id);
  if (!existing) {
    throw new AppError('Track video not found', 404, 'NOT_FOUND');
  }

  await pool.execute('DELETE FROM track_videos WHERE id = ?', [id]);
  sendSuccess(res, 200, null, 'Track video association deleted');
}
