import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const USER_STATUSES = ['active', 'suspended', 'banned'];

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

async function logAdminAction(connection, adminUserId, action, targetType, targetId, details = null) {
  await connection.execute(
    `INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminUserId, action, targetType, targetId, details ? JSON.stringify(details) : null, null]
  );
}

export async function adminGetDashboard(req, res) {
  await requireAdmin(req);

  const [[{ users }]] = await pool.execute('SELECT COUNT(*) AS users FROM users');
  const [[{ active_users }]] = await pool.execute('SELECT COUNT(*) AS active_users FROM users WHERE status = "active"');
  const [[{ favorites }]] = await pool.execute('SELECT COUNT(*) AS favorites FROM favorite_tracks');
  const [[{ plays }]] = await pool.execute('SELECT COUNT(*) AS plays FROM play_history');
  const [[{ listened_time }]] = await pool.execute('SELECT COALESCE(SUM(listened_seconds), 0) AS listened_time FROM play_history');
  const [[{ products_sold }]] = await pool.execute('SELECT COUNT(*) AS products_sold FROM orders WHERE status = "paid"');
  const [[{ revenue }]] = await pool.execute('SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status = "paid"');
  const [[{ environments }]] = await pool.execute('SELECT COUNT(*) AS environments FROM environments WHERE is_active = TRUE');
  const [[{ pending_reports }]] = await pool.execute('SELECT COUNT(*) AS pending_reports FROM reports WHERE status = "open"');

  sendSuccess(res, 200, {
    users,
    active_users,
    favorites,
    plays,
    listened_time,
    products_sold,
    revenue,
    environments,
    pending_reports,
  });
}

export async function adminGetUsers(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const status = url.searchParams.get('status');
  const role = url.searchParams.get('role');

  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (role) { conditions.push('role = ?'); params.push(role); }

  const [rows] = await pool.execute(
    `SELECT id, username, email, display_name, avatar_url, role, status, created_at, updated_at
     FROM users
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { users: rows, meta: { total, limit, offset } });
}

export async function adminGetUserById(req, res) {
  const admin = await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid user ID', 400, 'VALIDATION_ERROR');

  const [rows] = await pool.execute(
    `SELECT id, username, email, display_name, avatar_url, role, status, created_at, updated_at
     FROM users
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) throw new AppError('User not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, { user: rows[0] });
}

export async function adminUpdateUserStatus(req, res) {
  const admin = await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid user ID', 400, 'VALIDATION_ERROR');

  const { status } = req.body || {};
  if (!status) throw new AppError('status is required', 400, 'VALIDATION_ERROR');
  if (!USER_STATUSES.includes(status)) throw new AppError(`status must be one of: ${USER_STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) throw new AppError('User not found', 404, 'NOT_FOUND');

    await logAdminAction(connection, admin.id, 'update_user_status', 'user', String(id), { new_status: status });

    await connection.commit();
    sendSuccess(res, 200, null, 'User status updated');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
