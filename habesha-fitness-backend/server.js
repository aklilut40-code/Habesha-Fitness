import { createServer } from 'node:http';
import { config } from './src/config.js';
import { initDb, closeDb } from './src/db.js';
import { ensureAdmin, authorize, bearer, userFromToken } from './src/auth.js';
import { HttpError, matchRoute, send, readJson, corsHeaders } from './src/http.js';
import './src/routes/auth.js';
import './src/routes/data.js';
import './src/routes/chat.js';

export async function createApp() {
  await initDb(); // connect to PostgreSQL, create tables, load sample data the first time
  await ensureAdmin();

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders(req));
        return res.end();
      }

      const { route, params, pathMatched } = matchRoute(req.method, url.pathname);
      if (!route) {
        if (pathMatched) throw new HttpError(405, 'Method not allowed');
        throw new HttpError(404, 'Not found');
      }

      const user = await userFromToken(bearer(req));
      authorize(route.access, user);

      const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readJson(req);
      const query = Object.fromEntries(url.searchParams);
      const out = await route.handler({ req, res, params, query, body, user });
      if (out && typeof out === 'object' && 'status' in out && 'body' in out) send(req, res, out.status, out.body);
      else send(req, res, 200, out);
    } catch (err) {
      if (err instanceof HttpError) {
        send(req, res, err.status, { error: err.message, ...(err.details ? { details: err.details } : {}) });
      } else if (err.code === '23505') {
        send(req, res, 409, { error: 'That value already exists' }); // PostgreSQL unique violation
      } else if (err.code === '22007' || err.code === '22008' || err.code === '22P02' || err.code === '23514') {
        send(req, res, 400, { error: 'Some of the values are not valid' }); // bad date / number / rule
      } else {
        console.error('[error]', err);
        send(req, res, 500, { error: 'Something went wrong on the server' });
      }
    }
  });
}

// Start only when run directly (tests import createApp instead).
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const server = await createApp();
    server.listen(config.port, () => {
      console.log(`\n  Habesha Fitness API running on http://localhost:${config.port}`);
      console.log(`  Database: PostgreSQL (${new URL(config.databaseUrl).host}${new URL(config.databaseUrl).pathname})`);
      console.log(`  Allowed website origins: ${config.corsOrigins.join(', ')}`);
      console.log(`  AI chat: ${config.ai.key ? `ON (${config.ai.provider}, ${config.ai.model})` : 'OFF (set AI_API_KEY in .env to enable)'}`);
      console.log(`  Admin login: ${config.admin.email}\n`);
      if (config.admin.password === 'Admin1234') console.log('  ! Default admin password in use. Change ADMIN_PASSWORD before real use.\n');
    });
    const stop = async () => { server.close(); await closeDb(); process.exit(0); };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (err) {
    console.error(`\n  Could not start: ${err.message}\n`);
    process.exit(1);
  }
}
