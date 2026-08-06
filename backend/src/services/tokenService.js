import { randomBytes, createHash } from 'node:crypto';

const TOKEN_BYTES = 32;

export function generateSessionToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}
