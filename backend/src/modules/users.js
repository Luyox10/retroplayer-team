import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAuth } from '../middleware/authenticate.js';

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

export async function getUserById(userId) {
  const [rows] = await pool.execute(
    `SELECT id, username, email, role, status, display_name, avatar_url, created_at, updated_at
     FROM users
     WHERE id = ?`,
    [userId]
  );
  return rows[0] || null;
}

export async function getProfile(req, res) {
  const user = await requireAuth(req);
  sendSuccess(res, 200, { user: sanitizeUser(user) });
}

export async function updateProfile(req, res) {
  const user = await requireAuth(req);
  const { display_name, avatar_url } = req.body || {};
  const userId = user.id;

  if (display_name !== undefined) {
    if (typeof display_name !== 'string') {
      throw new AppError('display_name must be a string', 400, 'VALIDATION_ERROR');
    }
    if (display_name.length > 64) {
      throw new AppError('display_name must be at most 64 characters', 400, 'VALIDATION_ERROR');
    }
  }

  if (avatar_url !== undefined) {
    try {
      new URL(avatar_url);
    } catch {
      throw new AppError('avatar_url must be a valid URL', 400, 'VALIDATION_ERROR');
    }
  }

  const fields = [];
  const values = [];

  if (display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(display_name.trim() || null);
  }

  if (avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(avatar_url);
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');
  }

  values.push(userId);
  await pool.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const updatedUser = sanitizeUser(await getUserById(userId));
  sendSuccess(res, 200, { user: updatedUser });
}
