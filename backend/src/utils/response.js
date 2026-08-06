export function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export function sendSuccess(res, status = 200, data = null, message = null) {
  sendJson(res, status, { success: true, data, message });
}

export function sendError(res, status = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR') {
  sendJson(res, status, { success: false, data: null, message, errorCode });
}

export function sendBadRequest(res, message = 'Bad Request', errorCode = 'BAD_REQUEST') {
  sendError(res, 400, message, errorCode);
}

export function sendUnauthorized(res, message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
  sendError(res, 401, message, errorCode);
}

export function sendForbidden(res, message = 'Forbidden', errorCode = 'FORBIDDEN') {
  sendError(res, 403, message, errorCode);
}

export function sendNotFound(res, message = 'Not found', errorCode = 'NOT_FOUND') {
  sendError(res, 404, message, errorCode);
}

export function sendConflict(res, message = 'Conflict', errorCode = 'CONFLICT') {
  sendError(res, 409, message, errorCode);
}
