#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const port = Number.parseInt(process.env.PORT || '3000', 10);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function sendError(res, code, message) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function resolvePath(requestUrl) {
  const parsed = new URL(requestUrl, 'http://localhost');
  const pathname = decodeURIComponent(parsed.pathname);
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(rootDir, safePath));

  if (!filePath.startsWith(rootDir)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || '/');

  if (!filePath) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      sendError(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => sendError(res, 500, 'Internal server error'));
    stream.pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Arma Mortar Calculator local server: http://localhost:${port}`);
});
