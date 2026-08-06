import { pool } from '../database/pool.js';
import { hashPassword, verifyPassword } from '../services/passwordService.js';
import { generateSessionToken } from '../services/tokenService.js';
import { createSession, deleteSessionByToken } from './sessions.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { sanitizeUser, getUserById } from './users.js';
import { requireAuth } from '../middleware/authenticate.js';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }
  if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
    record.count = 1;
    record.firstAttempt = now;
    return;
  }
  record.count += 1;
  if (record.count > MAX_LOGIN_ATTEMPTS) {
    throw new AppError('Too many login attempts. Try again later.', 429, 'TOO_MANY_REQUESTS');
  }
}

function resetLoginRateLimit(ip) {
  loginAttempts.delete(ip);
}

function validateUsername(username) {
  if (!username || !USERNAME_REGEX.test(username)) {
    throw new AppError(
      'Username must be 3-32 characters and contain only letters, numbers and underscores',
      400,
      'VALIDATION_ERROR'
    );
  }
}

function validateEmail(email) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError('Invalid email address', 400, 'VALIDATION_ERROR');
  }
}

function validatePassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AppError('Password must contain at least one letter and one number', 400, 'VALIDATION_ERROR');
  }
}

export async function register(req, res) {
  const { username, email, password, display_name } = req.body || {};

  validateUsername(username);
  validateEmail(email);
  validatePassword(password);

  const trimmedDisplay = display_name ? display_name.trim() : null;
  if (trimmedDisplay && trimmedDisplay.length > 64) {
    throw new AppError('Display name must be at most 64 characters', 400, 'VALIDATION_ERROR');
  }

  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );
  if (existing.length > 0) {
    throw new AppError('Username or email already in use', 409, 'CONFLICT');
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.execute(
    `INSERT INTO users (username, email, password_hash, display_name, role, status)
     VALUES (?, ?, ?, ?, 'user', 'active')`,
    [username, email, passwordHash, trimmedDisplay || null]
  );

  const userId = result.insertId;
  const rawToken = generateSessionToken();
  await createSession(userId, rawToken);

  const user = sanitizeUser(await getUserById(userId));
  sendSuccess(res, 201, { user, token: rawToken }, 'User registered successfully');
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const ip = getClientIp(req);

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
  }

  checkLoginRateLimit(ip);

  const [rows] = await pool.execute(
    `SELECT id, username, email, password_hash, role, status, display_name, avatar_url, created_at, updated_at
     FROM users
     WHERE email = ?`,
    [email]
  );

  const user = rows[0];

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  if (user.status !== 'active') {
    throw new AppError('Account is suspended', 403, 'FORBIDDEN');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    checkLoginRateLimit(ip);
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  resetLoginRateLimit(ip);
  const rawToken = generateSessionToken();
  await createSession(user.id, rawToken);

  sendSuccess(res, 200, { user: sanitizeUser(user), token: rawToken }, 'Login successful');
}

export async function logout(req, res) {
  await requireAuth(req);
  await deleteSessionByToken(req.token);
  sendSuccess(res, 200, null, 'Logged out successfully');
}

export async function me(req, res) {
  const user = await requireAuth(req);
  sendSuccess(res, 200, { user: sanitizeUser(user) });
}
