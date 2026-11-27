'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, isRateLimited } = require('../src/app');

function startServer() {
  return new Promise((resolve) => {
    const server = createApp();
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('GET /health returns ok', async () => {
  const server = await startServer();
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  server.close();
});

test('security headers are present', async () => {
  const server = await startServer();
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/info`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  server.close();
});

test('unknown route returns 404', async () => {
  const server = await startServer();
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/nope`);
  assert.equal(res.status, 404);
  server.close();
});

test('non-GET method returns 405', async () => {
  const server = await startServer();
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`, { method: 'POST' });
  assert.equal(res.status, 405);
  server.close();
});

test('rate limiter blocks after 60 requests', () => {
  const ip = 'test-ip';
  const now = Date.now();
  let blocked = false;
  for (let i = 0; i < 65; i += 1) {
    blocked = isRateLimited(ip, now);
  }
  assert.equal(blocked, true);
});
