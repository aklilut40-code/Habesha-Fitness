import { route, bad, HttpError, clientIp } from '../http.js';
import { query, tx } from '../db.js';
import {
  hashPassword, verifyPassword, fakeVerify, createSession, destroySession, destroyUserSessions,
  bearer, publicUser, findUser,
} from '../auth.js';
import { isEmail, isPhone, GENDERS, passwordIssue } from '../validators.js';
import { hit, clear } from '../rateLimit.js';
import { uid } from '../dates.js';

const s = (v) => (typeof v === 'string' ? v : '');

// POST /api/auth/register — creates an account (role "member") AND a Pending member record,
// exactly like the website's Register page, so the admin sees "new registration needs a plan".
route('POST', '/api/auth/register', 'public', async ({ req, body }) => {
  const lim = hit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!lim.ok) throw new HttpError(429, 'Too many registrations. Try again later.');

  const e = {};
  const name = s(body.name).trim();
  const email = s(body.email).trim().toLowerCase();
  const phone = s(body.phone).trim();
  if (name.length < 3) e.name = 'Enter your full name (3+ characters)';
  if (!isEmail(email)) e.email = 'Enter a valid email address';
  if (!isPhone(phone)) e.phone = 'Enter a valid phone number';
  if (!GENDERS.includes(body.gender)) e.gender = 'Select a gender';
  const pw = passwordIssue(s(body.password));
  if (pw) e.password = pw;
  if (Object.keys(e).length) throw bad('Please fix the highlighted fields', e);

  // Account + Pending member + login are created together or not at all.
  const out = await tx(async (c) => {
    const made = await c.query(
      `INSERT INTO users (email, name, phone, gender, role, title, password_hash) VALUES ($1,$2,$3,$4,'member','Member',$5)
       ON CONFLICT (email) DO NOTHING RETURNING email`,
      [email, name, phone, body.gender, hashPassword(body.password)]
    );
    if (!made.rows.length) throw new HttpError(409, 'An account with this email already exists.');
    await c.query(
      `INSERT INTO members (id, name, email, phone, gender, status, join_date, notes)
       SELECT $1, $2, $3, $4, $5, 'Pending', CURRENT_DATE, 'Self-registered on the website'
       WHERE NOT EXISTS (SELECT 1 FROM members WHERE lower(email) = $3)`,
      [uid('mem'), name, email, phone, body.gender]
    );
    return { token: await createSession(email, c), user: publicUser(await findUser(email, c)) };
  });
  return { status: 201, body: out };
});

// POST /api/auth/login
route('POST', '/api/auth/login', 'public', async ({ req, body }) => {
  const email = s(body.email).trim().toLowerCase();
  const key = `login:${clientIp(req)}:${email}`;
  const lim = hit(key, 8, 15 * 60 * 1000);
  if (!lim.ok) throw new HttpError(429, `Too many attempts. Try again in ${Math.ceil(lim.retryAfter / 60)} minutes.`);

  const user = await findUser(email);
  const ok = user ? verifyPassword(s(body.password), user.hash) : (fakeVerify(s(body.password)), false);
  if (!ok) throw new HttpError(401, 'Incorrect email or password.');

  clear(key);
  return { token: await createSession(email), user: publicUser(user) };
});

route('POST', '/api/auth/logout', 'public', async ({ req }) => {
  await destroySession(bearer(req));
  return { ok: true };
});

route('GET', '/api/auth/me', 'user', ({ user }) => ({ user: publicUser(user) }));

// PATCH /api/auth/profile — name, phone, gender, title (the Settings page "Your profile" card)
route('PATCH', '/api/auth/profile', 'user', async ({ user, body }) => {
  const e = {};
  if (body.name !== undefined && s(body.name).trim().length < 3) e.name = 'Enter at least 3 characters';
  if (body.phone !== undefined && !isPhone(body.phone)) e.phone = 'Enter a valid phone number';
  if (body.gender !== undefined && !GENDERS.includes(body.gender)) e.gender = 'Select a gender';
  if (Object.keys(e).length) throw bad('Please fix the highlighted fields', e);
  const next = {
    name: body.name !== undefined ? s(body.name).trim() : user.name,
    phone: body.phone !== undefined ? s(body.phone).trim() : user.phone,
    gender: body.gender !== undefined ? s(body.gender).trim() : user.gender,
    title: body.title !== undefined && user.role !== 'member' ? s(body.title).trim().slice(0, 60) : user.title,
  };
  await query('UPDATE users SET name = $2, phone = $3, gender = $4, title = $5 WHERE email = $1', [user.email, next.name, next.phone, next.gender, next.title]);
  return { user: publicUser({ ...user, ...next }) };
});

// POST /api/auth/change-password — { current, next }
route('POST', '/api/auth/change-password', 'user', async ({ req, user, body }) => {
  const lim = hit(`pw:${user.email}`, 8, 15 * 60 * 1000);
  if (!lim.ok) throw new HttpError(429, 'Too many attempts. Try again later.');
  if (!verifyPassword(s(body.current), user.hash)) throw new HttpError(400, 'Current password is incorrect.');
  const issue = passwordIssue(s(body.next));
  if (issue) throw bad(issue, { next: issue });
  await query('UPDATE users SET password_hash = $2 WHERE email = $1', [user.email, hashPassword(body.next)]);
  await destroyUserSessions(user.email, bearer(req)); // log out other devices
  return { ok: true };
});
