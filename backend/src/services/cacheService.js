import { pool } from '../database/pool.js';

const DEFAULT_TTL_SECONDS = 3600;

function buildKey(source, type, identifier) {
  return `${source}:${type}:${identifier}`;
}

export async function getCached(type, identifier, source = 'youtube', ttlSeconds = DEFAULT_TTL_SECONDS) {
  const key = buildKey(source, type, identifier);
  const [rows] = await pool.execute(
    'SELECT cache_value, expires_at FROM api_cache WHERE cache_key = ? AND expires_at > NOW()',
    [key]
  );
  if (rows.length > 0) {
    const raw = rows[0].cache_value;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  return null;
}

export async function setCached(type, identifier, data, source = 'youtube', ttlSeconds = DEFAULT_TTL_SECONDS) {
  const key = buildKey(source, type, identifier);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await pool.execute(
    `INSERT INTO api_cache (cache_key, cache_value, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE cache_value = VALUES(cache_value), expires_at = VALUES(expires_at)`,
    [key, JSON.stringify(data), expiresAt]
  );
}
