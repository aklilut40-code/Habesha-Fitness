import pg from 'pg';
import { config } from './config.js';
import { buildSeed } from './seed.js';

const { Pool, types } = pg;

// Return numbers and plain 'YYYY-MM-DD' strings (not JavaScript Date objects) so the JSON
// matches what the website expects and no time-zone shifting can happen.
types.setTypeParser(1700, (v) => Number(v)); // numeric (money)
types.setTypeParser(20, (v) => Number(v)); // bigint (counts)
types.setTypeParser(1082, (v) => v); // date

let pool = null;

// ---------------------------------------------------------------------------
// Schema. Written so it can run on every start ("IF NOT EXISTS"). Column names are snake_case
// in the database; the routes rename them to camelCase for the website (e.g. plan_id AS "planId").
// ---------------------------------------------------------------------------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id          integer PRIMARY KEY CHECK (id = 1),          -- exactly one row
  gym_name    text NOT NULL,
  email       text NOT NULL,
  phone       text NOT NULL,
  address     text NOT NULL,
  hours       text NOT NULL,
  new_member  boolean NOT NULL DEFAULT true,
  payment     boolean NOT NULL DEFAULT true,
  expiry      boolean NOT NULL DEFAULT true,
  weekly      boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS users (
  email          text PRIMARY KEY,
  name           text NOT NULL,
  phone          text NOT NULL,
  gender         text NOT NULL,
  role           text NOT NULL CHECK (role IN ('admin', 'staff', 'member')),
  title          text NOT NULL DEFAULT '',
  password_hash  text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  text PRIMARY KEY,
  email       text NOT NULL REFERENCES users(email) ON DELETE CASCADE ON UPDATE CASCADE,
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_email_idx ON sessions (email);

CREATE TABLE IF NOT EXISTS plans (
  seq              bigserial,
  id               text PRIMARY KEY,
  name             text NOT NULL,
  price            numeric(10,2) NOT NULL CHECK (price > 0),
  duration_months  integer NOT NULL CHECK (duration_months BETWEEN 1 AND 36),
  popular          boolean NOT NULL DEFAULT false,
  benefits         text[] NOT NULL DEFAULT '{}',
  access           text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS trainers (
  seq             bigserial,
  id              text PRIMARY KEY,
  name            text NOT NULL,
  specialization  text NOT NULL,
  experience      integer NOT NULL CHECK (experience BETWEEN 0 AND 60),
  email           text NOT NULL,
  phone           text NOT NULL,
  availability    text NOT NULL,
  photo           text,
  bio             text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS members (
  seq          bigserial,
  id           text PRIMARY KEY,
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text NOT NULL,
  gender       text NOT NULL,
  plan_id      text REFERENCES plans(id) ON DELETE SET NULL,
  trainer_id   text REFERENCES trainers(id) ON DELETE SET NULL,
  program_id   text,
  status       text NOT NULL CHECK (status IN ('Active', 'Pending', 'Expired')),
  join_date    date NOT NULL,
  expiry_date  date,
  notes        text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS members_email_uq ON members (lower(email));
CREATE INDEX IF NOT EXISTS members_status_idx ON members (status);

CREATE TABLE IF NOT EXISTS payments (
  seq          bigserial,
  id           text PRIMARY KEY,
  member_id    text REFERENCES members(id) ON DELETE SET NULL,   -- history stays when a member is removed
  member_name  text NOT NULL,
  plan_id      text REFERENCES plans(id) ON DELETE SET NULL,
  amount       numeric(10,2) NOT NULL CHECK (amount > 0),
  pay_date     date NOT NULL,
  method       text NOT NULL CHECK (method IN ('Cash', 'Card', 'Mobile Money', 'Bank Transfer')),
  status       text NOT NULL CHECK (status IN ('Paid', 'Pending', 'Failed')),
  note         text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS payments_member_idx ON payments (member_id);
CREATE INDEX IF NOT EXISTS payments_date_idx ON payments (pay_date);

CREATE TABLE IF NOT EXISTS attendance (
  seq         bigserial,
  id          text PRIMARY KEY,
  member_id   text NOT NULL REFERENCES members(id) ON DELETE CASCADE,   -- deleting a member deletes their visits
  visit_date  date NOT NULL,
  check_in    text NOT NULL,
  check_out   text
);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (visit_date);
CREATE INDEX IF NOT EXISTS attendance_member_idx ON attendance (member_id);
-- A member can have only one open (not checked-out) visit per day, enforced by the database itself.
CREATE UNIQUE INDEX IF NOT EXISTS attendance_one_open_uq ON attendance (member_id, visit_date) WHERE check_out IS NULL;
`;

// If the database named in DATABASE_URL does not exist yet, create it (needs permission, which the
// default "postgres" user has). This saves beginners from a manual CREATE DATABASE step.
async function ensureDatabase() {
  const probe = new Pool({ connectionString: config.databaseUrl, max: 1, ssl: ssl(), connectionTimeoutMillis: 5000 });
  try {
    await probe.query('SELECT 1');
    return;
  } catch (err) {
    if (err.code !== '3D000') throw explain(err); // 3D000 = database does not exist
  } finally {
    await probe.end().catch(() => {});
  }
  const u = new URL(config.databaseUrl);
  const dbName = decodeURIComponent(u.pathname.slice(1));
  u.pathname = '/postgres';
  const admin = new Pool({ connectionString: u.toString(), max: 1, ssl: ssl(), connectionTimeoutMillis: 5000 });
  try {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`  Created database "${dbName}"`);
  } catch (err) {
    throw explain(err);
  } finally {
    await admin.end().catch(() => {});
  }
}

const ssl = () => (config.databaseSsl ? { rejectUnauthorized: false } : false);

function explain(err) {
  const where = (() => { try { const u = new URL(config.databaseUrl); return `${u.hostname}:${u.port || 5432}`; } catch { return 'DATABASE_URL'; } })();
  if (err.code === 'ECONNREFUSED') return new Error(`Cannot reach PostgreSQL at ${where}. Is PostgreSQL running? (See README, section 1.)`);
  if (err.code === '28P01') return new Error('PostgreSQL refused the password. Check the user and password in DATABASE_URL.');
  if (err.code === '28000') return new Error('PostgreSQL refused this user. Check DATABASE_URL.');
  return err;
}

/** Connect, create tables if missing, and load the sample data the first time. */
export async function initDb() {
  if (pool) return pool;
  await ensureDatabase();
  pool = new Pool({ connectionString: config.databaseUrl, max: 10, ssl: ssl() });
  pool.on('error', (e) => console.error('[db] idle client error', e.message));
  await pool.query(SCHEMA);
  const { rows } = await pool.query('SELECT 1 FROM settings WHERE id = 1');
  if (!rows.length) await seedData(pool);
  return pool;
}

export const query = (text, params) => pool.query(text, params);

/** Run several statements as ONE all-or-nothing transaction. fn receives a client with .query(). */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
}

// ---------------------------------------------------------------------------
// Sample data (the same data the website shows)
// ---------------------------------------------------------------------------
async function bulkInsert(client, table, cols, rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const params = [];
    const values = chunk.map((r) => `(${r.map((v) => { params.push(v); return `$${params.length}`; }).join(', ')})`);
    await client.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES ${values.join(', ')}`, params);
  }
}

// Lists are shown newest-first (ORDER BY seq DESC), so rows are inserted in reverse to keep the seed's order.
const rev = (a) => [...a].reverse();

async function seedData(client) {
  const s = buildSeed();
  await tx(async (c) => {
    await c.query(
      `INSERT INTO settings (id, gym_name, email, phone, address, hours, new_member, payment, expiry, weekly) VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [s.settings.gymName, s.settings.email, s.settings.phone, s.settings.address, s.settings.hours,
        s.notifications.newMember, s.notifications.payment, s.notifications.expiry, s.notifications.weekly]
    );
    await bulkInsert(c, 'plans', ['id', 'name', 'price', 'duration_months', 'popular', 'benefits', 'access'],
      s.plans.map((p) => [p.id, p.name, p.price, p.durationMonths, p.popular, p.benefits, p.access || []]));
    await bulkInsert(c, 'trainers', ['id', 'name', 'specialization', 'experience', 'email', 'phone', 'availability', 'photo', 'bio'],
      rev(s.trainers).map((t) => [t.id, t.name, t.specialization, t.experience, t.email, t.phone, t.availability, t.photo ?? null, t.bio || '']));
    await bulkInsert(c, 'members', ['id', 'name', 'email', 'phone', 'gender', 'plan_id', 'trainer_id', 'program_id', 'status', 'join_date', 'expiry_date', 'notes'],
      rev(s.members).map((m) => [m.id, m.name, m.email, m.phone, m.gender, m.planId, m.trainerId, m.programId, m.status, m.joinDate, m.expiryDate, m.notes || '']));
    await bulkInsert(c, 'payments', ['id', 'member_id', 'member_name', 'plan_id', 'amount', 'pay_date', 'method', 'status', 'note'],
      rev(s.payments).map((p) => [p.id, p.memberId, p.memberName, p.planId, p.amount, p.date, p.method, p.status, p.note || '']));
    await bulkInsert(c, 'attendance', ['id', 'member_id', 'visit_date', 'check_in', 'check_out'],
      rev(s.attendance).map((a) => [a.id, a.memberId, a.date, a.checkIn, a.checkOut]));
  });
}

/** Replace the gym data with the sample data again. Accounts (users) and logins are kept. */
export async function resetData() {
  await tx(async (c) => {
    await c.query('TRUNCATE attendance, payments, members, trainers, plans, settings RESTART IDENTITY');
  });
  await seedData(pool);
}
