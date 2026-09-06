#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { parseEnv } from 'node:util';

// PM2 keeps a snapshot of old environment variables across restarts. Node's
// process.loadEnvFile() deliberately does not overwrite variables that already
// exist, which meant stale Clerk/DB credentials could survive even after
// .env.local was corrected. Treat BuildPair's local env file as authoritative
// for application configuration while preserving the few runtime values the
// deploy script intentionally injects for the staging process.
const localEnvFile = path.resolve(process.cwd(), '.env.local');
const fallbackEnvFile = path.resolve(process.cwd(), '.env');
const runtimeOverrides = new Set([
  'PORT',
  'NODE_ENV',
  'APP_URL',
  'EXPO_PUBLIC_API_URL',
  'BUILDPAIR_NOINDEX',
  'BUILDPAIR_BUILD_SHA',
]);
const envFile = existsSync(localEnvFile) ? localEnvFile : (existsSync(fallbackEnvFile) ? fallbackEnvFile : null);
if (envFile) {
  const parsed = parseEnv(readFileSync(envFile, 'utf8'));
  for (const [name, value] of Object.entries(parsed)) {
    if (!runtimeOverrides.has(name)) process.env[name] = value;
  }
}

if (!process.env.BUILDPAIR_BUILD_SHA) {
  try {
    process.env.BUILDPAIR_BUILD_SHA = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // Production images may not contain .git metadata. The deploy environment
    // can still provide BUILDPAIR_BUILD_SHA explicitly in that case.
  }
}

// expo-server 57 publishes both ESM and CommonJS adapters. Its ESM build currently
// contains extensionless internal imports that native Node 22 rejects, so load the
// CommonJS adapter deliberately when running BuildPair's standalone Node server.
const require = createRequire(import.meta.url);
const { createRequestHandler } = require('expo-server/adapter/http');

const PORT = Number(process.env.PORT || 3000);
const CLIENT_BUILD_DIR = path.resolve(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.resolve(process.cwd(), 'dist/server');
const NOINDEX = /^(1|true|yes)$/i.test(process.env.BUILDPAIR_NOINDEX || '');

const expoHandler = createRequestHandler({
  build: SERVER_BUILD_DIR,
  environment: process.env.NODE_ENV === 'production' ? null : process.env.NODE_ENV,
});

const MIME_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'microphone=(), geolocation=(self), payment=(self)');
  if (NOINDEX) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

function safeCandidates(requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath.split('?')[0] || '/');
  } catch {
    return [];
  }

  const relative = decoded.replace(/^\/+/, '');
  if (!relative) return ['index.html'];

  const normalized = path.normalize(relative);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) return [];

  const candidates = [normalized];
  if (!path.extname(normalized)) {
    candidates.push(`${normalized}.html`);
    candidates.push(path.join(normalized, 'index.html'));
  }
  return candidates;
}

async function resolveStaticFile(requestPath) {
  for (const candidate of safeCandidates(requestPath)) {
    const absolute = path.resolve(CLIENT_BUILD_DIR, candidate);
    if (absolute !== CLIENT_BUILD_DIR && !absolute.startsWith(`${CLIENT_BUILD_DIR}${path.sep}`)) {
      continue;
    }

    try {
      const fileStat = await stat(absolute);
      if (fileStat.isFile()) return { absolute, size: fileStat.size, candidate };
    } catch {
      // Try the next candidate, then fall through to Expo's server handler.
    }
  }
  return null;
}

async function serveStatic(req, res) {
  if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) return false;

  const file = await resolveStaticFile(req.url);
  if (!file) return false;

  const extension = path.extname(file.absolute).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME_TYPES.get(extension) || 'application/octet-stream');
  res.setHeader('Content-Length', String(file.size));

  if (extension === '.html') {
    res.setHeader('Cache-Control', 'no-cache');
  } else if (file.candidate.includes('_expo/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  if (req.method === 'HEAD') {
    res.end();
    return true;
  }

  await new Promise((resolve, reject) => {
    const stream = createReadStream(file.absolute);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(res);
  });
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    applySecurityHeaders(res);

    if (await serveStatic(req, res)) return;

    // TLS may terminate at Caddy or Cloudflare. The Expo Node adapter checks
    // socket.encrypted when constructing request URLs, so trust the proxy flag.
    if (req.headers['x-forwarded-proto'] === 'https') {
      req.socket.encrypted = true;
    }

    await expoHandler(req, res, (error) => {
      if (res.writableEnded) return;
      if (error) {
        console.error('[BuildPair] Request failed:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return;
      }
      res.statusCode = 404;
      res.end('Not Found');
    });
  } catch (error) {
    console.error('[BuildPair] Server error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (!res.writableEnded) res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BuildPair] Server listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`[BuildPair] ${signal} received, shutting down.`);
  server.close((error) => {
    if (error) {
      console.error('[BuildPair] Shutdown failed:', error);
      process.exit(1);
    }
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
