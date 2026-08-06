export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
  }
}

export const ErrorCodes = Object.freeze({
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
});
