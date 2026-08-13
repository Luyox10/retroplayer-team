import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAuth } from '../middleware/authenticate.js';
import { recordPlay } from '../services/preferencesService.js';

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

function toBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export async function getHistory(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);

  const [rows] = await pool.execute(
    `SELECT id, external_track_id, source, title, artist, cover_url, duration_seconds, listened_seconds, completed, played_at, updated_at
     FROM play_history
     WHERE user_id = ?
     ORDER BY played_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    [user.id]
  );

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM play_history WHERE user_id = ?',
    [user.id]
  );

  sendSuccess(res, 200, { history: rows, meta: { total, limit, offset } });
}

export async function addHistory(req, res) {
  const user = await requireAuth(req);
  const { external_track_id, source, title, artist, cover_url, duration_seconds, listened_seconds, completed } = req.body || {};

  if (!external_track_id || !source) {
    throw new AppError('external_track_id and source are required', 400, 'VALIDATION_ERROR');
  }
  const ALLOWED_SOURCES = ['youtube'];
  if (!ALLOWED_SOURCES.includes(source)) {
    throw new AppError(`source must be one of: ${ALLOWED_SOURCES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const [result] = await pool.execute(
    `INSERT INTO play_history (user_id, external_track_id, source, title, artist, cover_url, duration_seconds, listened_seconds, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, external_track_id, source, title || null, artist || null, cover_url || null, duration_seconds || 0, listened_seconds || 0, toBoolean(completed)]
  );

  // Record play for preference learning (non-blocking)
  recordPlay(user.id, {
    externalId: external_track_id,
    source: { provider: source, id: external_track_id },
    artist: artist || '',
  }).catch(() => {});

  sendSuccess(res, 201, { id: result.insertId }, 'History entry created');
}

export async function updateHistory(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError('Invalid history ID', 400, 'VALIDATION_ERROR');
  }

  const { listened_seconds, completed } = req.body || {};
  const fields = [];
  const values = [];

  if (listened_seconds !== undefined) {
    fields.push('listened_seconds = ?');
    values.push(listened_seconds);
  }
  if (completed !== undefined) {
    fields.push('completed = ?');
    values.push(toBoolean(completed));
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');
  }

  values.push(user.id, id);
  const [result] = await pool.execute(
    `UPDATE play_history SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new AppError('History entry not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, 200, null, 'History entry updated');
}
