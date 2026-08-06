import { requireAuth } from './authenticate.js';
import { AppError } from '../utils/errors.js';

export async function requireAdmin(req) {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  }
  return user;
}
