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

export async function getUserAssets(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);

  const [rows] = await pool.execute(
    `SELECT ua.id, ua.product_id, p.name as product_name, p.type as product_type, p.image_url, ua.quantity, ua.acquired_at
     FROM user_assets ua
     JOIN products p ON ua.product_id = p.id
     WHERE ua.user_id = ?
     ORDER BY ua.acquired_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    [user.id]
  );

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM user_assets WHERE user_id = ?',
    [user.id]
  );

  sendSuccess(res, 200, { assets: rows, meta: { total, limit, offset } });
}
