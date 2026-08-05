import { config } from './config/environment.js';
import { checkDatabaseConnection } from './database/pool.js';
import { sendSuccess, sendError, sendNotFound } from './utils/response.js';

function getAllowedOrigins() {
  const origins = [config.FRONTEND_URL, config.ADMIN_PANEL_URL].filter(Boolean);
  if (config.NODE_ENV === 'development') {
    origins.push('http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173');
  }
  return origins;
}

function setCorsHeaders(res, origin, allowedOrigins) {
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
}

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  setCorsHeaders(res, origin, allowedOrigins);

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      ...(origin && allowedOrigins.includes(origin)
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            Vary: 'Origin',
          }
        : {}),
      'Content-Type': 'application/json',
    });
    res.end();
    return;
  }

  try {
    if (pathname === '/' && method === 'GET') {
      sendSuccess(res, 200, { message: 'RetroPlayer API' });
      return;
    }

    if (pathname === '/api/health' && method === 'GET') {
      sendSuccess(res, 200, { status: 'ok', service: 'retroplayer-api' });
      return;
    }

    if (pathname === '/api/health/database' && method === 'GET') {
      try {
        await checkDatabaseConnection();
        sendSuccess(res, 200, { status: 'ok', database: 'connected' });
      } catch (err) {
        console.error('Database health check failed:', err.message);
        sendError(res, 503, 'Service Unavailable', { status: 'error', database: 'disconnected' });
      }
      return;
    }

    sendNotFound(res);
  } catch (err) {
    console.error('Request error:', err.message);
    sendError(res, 500, 'Internal Server Error');
  }
}
