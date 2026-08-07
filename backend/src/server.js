import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { handleRequest } from './router.js';
import { config } from './config/environment.js';
import { pool } from './database/pool.js';
import { handleError } from './middleware/errorHandler.js';

function setCorsHeaders(req, res) {
  const allowedOrigins = [config.FRONTEND_URL, config.ADMIN_PANEL_URL].filter(Boolean);
  const origin = req.headers.origin;
  if (allowedOrigins.length > 0) {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = createServer((req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  handleRequest(req, res).catch((err) => {
    console.error('Unhandled server error:', err);
    handleError(res, err);
  });
});

function start() {
  server.listen(config.PORT, '0.0.0.0', () => {
    console.log(`[RetroPlayer API] Listening on http://0.0.0.0:${config.PORT} in ${config.NODE_ENV} mode`);
    console.log(`[RetroPlayer API] TiDB host: ${config.DB_HOST}:${config.DB_PORT}`);
    console.log(`[RetroPlayer API] Database: ${config.DB_NAME}`);
    const allowedOrigins = [config.FRONTEND_URL, config.ADMIN_PANEL_URL].filter(Boolean).join(', ') || 'none configured';
    console.log(`[RetroPlayer API] Allowed CORS origins: ${allowedOrigins}`);
  });
}

server.on('error', (err) => {
  console.error('[Server startup error]:', err.message);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`[${signal}] Received, shutting down gracefully...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await pool.end();
      console.log('[Server] Database pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error closing database pool:', err.message);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  start();
}
