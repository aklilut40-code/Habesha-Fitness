import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { config } from './config.js';
import { query } from './db.js';
import { HttpError } from './http.js';

// ---- Passwords: scrypt (slow on purpose) with a random salt per account ----
export function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export function verifyPassword(pw, stored) {
  const [kind, saltHex, keyHex] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(pw, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Compared when the email does not exist, so response time does not reveal which emails are registered.
const DUMMY = hashPassword('not-a-real-password');
export const fakeVerify = (pw) => verifyPassword(pw, DUMMY);

// ---- Sessions: a random token is given to the browser; only its SHA-256 is stored in the database ----
const sha = (t) => createHash('sha256').update(t).digest('hex');

export async function createSession(email, db = { query }) {
  const token = randomBytes(32).toString('base64url');
  await db.query(`INSERT INTO sessions (token_hash, email, expires_at) VALUES ($1, $2, now() + make_interval(days => $3::int))`, [sha(token), email, config.sessionDays]);
  await db.query('DELETE FROM sessions WHERE expires_at < now()'); // tidy up expired logins
  return token;
}

export async function destroySession(token) {
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [sha(token)]);
}

export async function destroyUserSessions(email, exceptToken) {
  await query('DELETE FROM sessions WHERE email = $1 AND token_hash <> $2', [email, exceptToken ? sha(exceptToken) : '']);
}

export const bearer = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
};

// Database row -> the account object the API uses (the password hash stays inside this file's callers).
const toUser = (r) => ({ name: r.name, email: r.email, phone: r.phone, gender: r.gender, role: r.role, title: r.title, createdAt: r.created_at, hash: r.password_hash });

export async function userFromToken(token) {
  if (!token) return null;
  const { rows } = await query(
    `SELECT u.* FROM sessions s JOIN users u ON u.email = s.email WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha(token)]
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function findUser(email, db = { query }) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ? toUser(rows[0]) : null;
}

/** Public view of an account (never includes the password hash). */
export const publicUser = ({ hash, ...rest }) => rest;

// Roles: admin (everything), staff (everything except settings/reset), member (own account only).
export const STAFF_ROLES = ['admin', 'staff'];

export function authorize(access, user) {
  if (access === 'public') return;
  if (!user) throw new HttpError(401, 'Please log in');
  if (access === 'user') return;
  if (access === 'staff' && !STAFF_ROLES.includes(user.role)) throw new HttpError(403, 'Staff access required');
  if (access === 'admin' && user.role !== 'admin') throw new HttpError(403, 'Administrator access required');
}

export async function ensureAdmin() {
  await query(
    `INSERT INTO users (email, name, phone, gender, role, title, password_hash)
     VALUES ($1, $2, '+251 911 000 001', 'Male', 'admin', 'Gym Administrator', $3)
     ON CONFLICT (email) DO NOTHING`,
    [config.admin.email, config.admin.name, hashPassword(config.admin.password)]
  );
}
