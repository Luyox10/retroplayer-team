import { test } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'node:http';
import http from 'node:http';

process.env.NODE_ENV = 'test';
process.env.APP_PORT = '0';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '65432';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'none';
process.env.DB_NAME = 'retroplayer';
process.env.DB_SSL = 'false';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.ADMIN_PANEL_URL = 'http://localhost:3002';

const { config } = await import('../config/environment.js');
const { handleRequest } = await import('../router.js');
const { checkDatabaseConnection } = await import('../database/pool.js');

function request(server, path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.request(
      { host: '127.0.0.1', port, path, method, headers },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      handleRequest(req, res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

test('config is loaded and immutable', () => {
  assert.strictEqual(config.NODE_ENV, 'test');
  assert.strictEqual(typeof config.PORT, 'number');
  assert.strictEqual(Object.isFrozen(config), true);
});

test('GET /', async () => {
  const server = await startServer();
  try {
    const { status, body } = await request(server, '/');
    assert.strictEqual(status, 200);
    const parsed = JSON.parse(body);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.message, 'RetroPlayer API');
  } finally {
    server.close();
  }
});

test('GET /api/health', async () => {
  const server = await startServer();
  try {
    const { status, body } = await request(server, '/api/health');
    assert.strictEqual(status, 200);
    const parsed = JSON.parse(body);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.status, 'ok');
    assert.strictEqual(parsed.service, 'retroplayer-api');
  } finally {
    server.close();
  }
});

test('GET unknown route returns 404', async () => {
  const server = await startServer();
  try {
    const { status, body } = await request(server, '/api/unknown');
    assert.strictEqual(status, 404);
    const parsed = JSON.parse(body);
    assert.strictEqual(parsed.success, false);
  } finally {
    server.close();
  }
});

test('GET /api/health/database returns controlled disconnect', { timeout: 15000 }, async () => {
  const server = await startServer();
  try {
    const { status, body } = await request(server, '/api/health/database');
    assert.strictEqual(status, 503);
    const parsed = JSON.parse(body);
    assert.strictEqual(parsed.success, false);
    assert.strictEqual(parsed.database, 'disconnected');
  } finally {
    server.close();
  }
});

test('checkDatabaseConnection with fake pool succeeds', async () => {
  const fakePool = {
    getConnection: async () => ({
      execute: async () => {},
      release: () => {},
    }),
  };
  const result = await checkDatabaseConnection(fakePool);
  assert.strictEqual(result, true);
});

test('checkDatabaseConnection fails when pool rejects', async () => {
  const fakePool = {
    getConnection: async () => { throw new Error('connection refused'); },
  };
  await assert.rejects(async () => checkDatabaseConnection(fakePool), /connection refused/);
});
