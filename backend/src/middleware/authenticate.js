import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { getSessionByToken } from '../modules/sessions.js';

function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1];

  const cookieHeader = req.headers.cookie || req.headers.Cookie || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  if (cookieMatch) return cookieMatch[1];

  return null;
}

export async function requireAuth(req) {
  const token = extractToken(req);
  if (!token) {
    throw new AppError('Missing or invalid authentication token', 401, 'UNAUTHORIZED');
  }

  const session = await getSessionByToken(token);
  if (!session) {
    throw new AppError('Session expired or invalid', 401, 'UNAUTHORIZED');
  }

  const [rows] = await pool.execute(
    `SELECT id, username, email, role, status, display_name, avatar_url, created_at, updated_at
     FROM users
     WHERE id = ?`,
    [session.user_id]
  );

  const user = rows[0];
  if (!user) {
    throw new AppError('User not found', 401, 'UNAUTHORIZED');
  }

  if (user.status !== 'active') {
    throw new AppError('Account is suspended', 403, 'FORBIDDEN');
  }

  req.token = token;
  req.user = user;
  return user;
}
