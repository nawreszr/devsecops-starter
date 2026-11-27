'use strict';

const http = require('node:http');

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'",
  'Cache-Control': 'no-store',
};

// Rate limiting simple en mémoire : 60 requêtes / minute / IP
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const hits = new Map();

function isRateLimited(ip, now = Date.now()) {
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

function send(res, status, body) {
  res.writeHead(status, SECURITY_HEADERS);
  res.end(JSON.stringify(body));
}

function createApp() {
  return http.createServer((req, res) => {
    const ip = req.socket.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
      return send(res, 429, { error: 'Too many requests' });
    }
    if (req.method !== 'GET') {
      return send(res, 405, { error: 'Method not allowed' });
    }

    const { pathname } = new URL(req.url, 'http://localhost');

    if (pathname === '/health') {
      return send(res, 200, { status: 'ok', uptime: Math.round(process.uptime()) });
    }
    if (pathname === '/api/info') {
      return send(res, 200, {
        name: 'devsecops-starter',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    }
    return send(res, 404, { error: 'Not found' });
  });
}

module.exports = { createApp, isRateLimited };
