export function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export function sendSuccess(res, status = 200, data = {}) {
  sendJson(res, status, { success: true, ...data });
}

export function sendError(res, status = 500, message = 'Internal Server Error', extra = {}) {
  sendJson(res, status, { success: false, message, ...extra });
}

export function sendNotFound(res) {
  sendError(res, 404, 'Not found');
}
