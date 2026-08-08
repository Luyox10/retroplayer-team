import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAuth } from '../middleware/authenticate.js';

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

export async function getFavorites(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);

  const [rows] = await pool.execute(
    `SELECT id, external_track_id, source, title, artist, cover_url, created_at
     FROM favorite_tracks
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    [user.id]
  );

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM favorite_tracks WHERE user_id = ?',
    [user.id]
  );

  sendSuccess(res, 200, { favorites: rows, meta: { total, limit, offset } });
}

export async function addFavorite(req, res) {
  const user = await requireAuth(req);
  const { external_track_id, source, title, artist, cover_url } = req.body || {};

  if (!external_track_id || !source) {
    throw new AppError('external_track_id and source are required', 400, 'VALIDATION_ERROR');
  }
  if (source !== 'youtube') {
    throw new AppError('source must be youtube', 400, 'VALIDATION_ERROR');
  }

  await pool.execute(
    `INSERT INTO favorite_tracks (user_id, external_track_id, source, title, artist, cover_url)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), artist = VALUES(artist), cover_url = VALUES(cover_url)`,
    [user.id, external_track_id, source, title || null, artist || null, cover_url || null]
  );

  sendSuccess(res, 201, null, 'Favorite added');
}

export async function removeFavorite(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  const source = parts[2];
  const externalTrackId = parts[3];

  if (!source || !externalTrackId) {
    throw new AppError('source and external_track_id are required', 400, 'VALIDATION_ERROR');
  }

  await pool.execute(
    'DELETE FROM favorite_tracks WHERE user_id = ? AND source = ? AND external_track_id = ?',
    [user.id, source, externalTrackId]
  );

  sendSuccess(res, 200, null, 'Favorite removed');
}
