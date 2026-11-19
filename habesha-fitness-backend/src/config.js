import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Tiny .env reader so the project needs no packages. Real environment variables win over the file.
function loadEnvFile() {
  const file = resolve(root, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const val = m[2].replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadEnvFile();

const env = (k, d = '') => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d);

export const config = {
  root,
  port: Number(env('PORT', '4000')),
  corsOrigins: env('CORS_ORIGIN', 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()).filter(Boolean),
  // PostgreSQL connection. Format: postgres://USER:PASSWORD@HOST:PORT/DATABASE
  databaseUrl: env('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/habesha_fitness'),
  databaseSsl: env('DATABASE_SSL', 'false').toLowerCase() === 'true', // set true for most hosted databases (Neon, Supabase, Render...)
  admin: {
    email: env('ADMIN_EMAIL', 'admin@habesha.demo').toLowerCase(),
    password: env('ADMIN_PASSWORD', 'Admin1234'),
    name: env('ADMIN_NAME', 'Aklilu Tesfay'),
  },
  sessionDays: 7,
  ai: {
    provider: env('AI_PROVIDER', 'openai').toLowerCase(),
    key: env('AI_API_KEY'),
    model: env('AI_MODEL', 'gpt-4o-mini'),
    baseUrl: env('AI_BASE_URL'),
    scope: env('AI_SCOPE', 'general').toLowerCase(),
    webSearch: env('AI_WEB_SEARCH', 'false').toLowerCase() === 'true',
    perHour: Number(env('AI_RATE_LIMIT_PER_HOUR', '20')),
  },
};
