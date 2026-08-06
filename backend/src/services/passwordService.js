import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SCRYPT_KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(32).toString('base64');
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEYLEN)).toString('base64');
  return `${salt}:${derivedKey}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  const storedKey = Buffer.from(key, 'base64');

  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}
