import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { handleRequest } from './router.js';
import { config } from './config/environment.js';
import { pool } from './database/pool.js';

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Unhandled request error:', err.message);
    try {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal Server Error' }));
    } catch {}
  });
});

function start() {
  server.listen(config.PORT, '0.0.0.0', () => {
    console.log(`RetroPlayer API listening on http://0.0.0.0:${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

server.on('error', (err) => {
  console.error('Server startup error:', err.message);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    pool.end()
      .then(() => {
        console.log('Database pool closed.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing pool:', err.message);
        process.exit(1);
      });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  start();
}
