import { config } from './config.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const bad = (message, details) => new HttpError(400, message, details);
export const notFound = (what = 'Not found') => new HttpError(404, what);

const routes = [];

/** access: 'public' | 'user' (any logged-in account) | 'staff' (admin or staff) | 'admin' */
export function route(method, path, access, handler) {
  const keys = [];
  const re = new RegExp(`^${path.replace(/:([a-zA-Z]+)/g, (_, k) => (keys.push(k), '([^/]+)'))}/?$`);
  routes.push({ method, re, keys, access, handler });
}

export function matchRoute(method, pathname) {
  let pathMatched = false;
  for (const r of routes) {
    const m = r.re.exec(pathname);
    if (!m) continue;
    pathMatched = true;
    if (r.method !== method) continue;
    const params = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return { route: r, params };
  }
  return { route: null, pathMatched };
}

export function corsHeaders(req) {
  const origin = req.headers.origin;
  const h = { Vary: 'Origin' };
  if (origin && (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin))) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

export function send(req, res, status, body) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(req),
  });
  res.end(data);
}

const MAX_BODY = 1024 * 1024;

export function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Request body is too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!size) return resolve({});
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(v && typeof v === 'object' ? v : {});
      } catch {
        reject(bad('Body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export const clientIp = (req) => req.socket.remoteAddress || 'unknown';
