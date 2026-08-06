import { pool } from '../database/pool.js';
import { hashSessionToken } from '../services/tokenService.js';

const SESSION_DURATION_HOURS = 24;

export async function createSession(userId, rawToken) {
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
}

export async function getSessionByToken(rawToken) {
  const tokenHash = hashSessionToken(rawToken);
  const [rows] = await pool.execute(
    `SELECT id, user_id, expires_at
     FROM sessions
     WHERE token = ? AND expires_at > NOW()`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function deleteSessionByToken(rawToken) {
  const tokenHash = hashSessionToken(rawToken);
  await pool.execute('DELETE FROM sessions WHERE token = ?', [tokenHash]);
}

export async function deleteAllUserSessions(userId) {
  await pool.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
}
