import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';

export function handleError(res, err) {
  if (err instanceof AppError) {
    console.error(`[AppError ${err.errorCode}]:`, err.message);
    sendError(res, err.statusCode, err.message, err.errorCode);
    return;
  }

  console.error('[Unexpected error]:', err);
  sendError(res, 500, 'Internal Server Error', 'INTERNAL_ERROR');
}
