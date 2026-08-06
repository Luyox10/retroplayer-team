import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const TARGET_TYPES = ['user', 'track', 'environment', 'object', 'video'];
const STATUSES = ['open', 'reviewed', 'resolved', 'dismissed'];

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

export async function createReport(req, res) {
  const user = await requireAuth(req);
  const { target_type, target_id, reason } = req.body || {};

  if (!target_type || !target_id || !reason) {
    throw new AppError('target_type, target_id and reason are required', 400, 'VALIDATION_ERROR');
  }
  if (!TARGET_TYPES.includes(target_type)) {
    throw new AppError(`target_type must be one of: ${TARGET_TYPES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const [result] = await pool.execute(
    `INSERT INTO reports (reporter_user_id, target_type, target_id, reason)
     VALUES (?, ?, ?, ?)`,
    [user.id, target_type, target_id, reason]
  );

  sendSuccess(res, 201, { id: result.insertId }, 'Report created');
}

export async function adminGetReports(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const status = url.searchParams.get('status');
  const targetType = url.searchParams.get('target_type');

  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (targetType) { conditions.push('target_type = ?'); params.push(targetType); }

  const [rows] = await pool.execute(
    `SELECT r.id, r.reporter_user_id, r.target_type, r.target_id, r.reason, r.status, r.reviewed_by, r.created_at, r.updated_at
     FROM reports r
     WHERE ${conditions.join(' AND ')}
     ORDER BY r.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM reports WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { reports: rows, meta: { total, limit, offset } });
}

export async function adminGetReportById(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid report ID', 400, 'VALIDATION_ERROR');

  const [rows] = await pool.execute(
    `SELECT id, reporter_user_id, target_type, target_id, reason, status, reviewed_by, created_at, updated_at
     FROM reports
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) throw new AppError('Report not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, { report: rows[0] });
}

export async function adminUpdateReport(req, res) {
  const admin = await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid report ID', 400, 'VALIDATION_ERROR');

  const { status } = req.body || {};
  if (!status) throw new AppError('status is required', 400, 'VALIDATION_ERROR');
  if (!STATUSES.includes(status)) throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE reports SET status = ?, reviewed_by = ? WHERE id = ?',
      [status, admin.id, id]
    );

    if (result.affectedRows === 0) throw new AppError('Report not found', 404, 'NOT_FOUND');

    await logAdminAction(connection, admin.id, 'update_report_status', 'report', String(id), { new_status: status });

    await connection.commit();
    sendSuccess(res, 200, null, 'Report updated');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
