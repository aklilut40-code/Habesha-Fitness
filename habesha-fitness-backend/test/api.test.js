import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// Tests run against a REAL PostgreSQL server. A temporary database is created for the run and deleted afterwards.
// Point TEST_DATABASE_URL at your server, or it will automatically borrow the credentials from .env.
function getAdminUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*DATABASE_URL\s*=\s*(.*?)\s*$/m);
    if (match) {
      try {
        const u = new URL(match[1].replace(/^["']|["']$/g, ''));
        u.pathname = '/postgres';
        return u.toString();
      } catch {}
    }
  }
  return 'postgres://postgres:postgres@localhost:5432/postgres';
}

const ADMIN_URL = getAdminUrl();
const TEST_DB = `habesha_test_${process.pid}_${Date.now()}`;
const testUrl = (() => { const u = new URL(ADMIN_URL); u.pathname = `/${TEST_DB}`; return u.toString(); })();

// A pretend AI service so the AI route can be tested without internet or a key.
let aiCalls = [];
const fakeAi = createServer((req, res) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    const body = JSON.parse(b);
    aiCalls.push({ auth: req.headers.authorization, body });
    if (body.messages.at(-1).content.includes('FAIL')) {
      res.writeHead(500); return res.end('boom with secret-key-123');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: 'Eat protein after training.' } }] }));
  });
});

let server, base, aiPort;

before(async () => {
  await new Promise((r) => fakeAi.listen(0, r));
  aiPort = fakeAi.address().port;
  process.env.DATABASE_URL = testUrl;
  process.env.AI_PROVIDER = 'openai-compatible';
  process.env.AI_API_KEY = 'secret-key-123';
  process.env.AI_BASE_URL = `http://127.0.0.1:${aiPort}/v1`;
  process.env.AI_RATE_LIMIT_PER_HOUR = '5';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  const { createApp } = await import('../server.js');
  server = await createApp();
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  fakeAi.close();
  const { closeDb } = await import('../src/db.js');
  await closeDb();
  const admin = new pg.Pool({ connectionString: ADMIN_URL, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
  await admin.end();
});

async function api(method, path, { token, body, headers } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null, headers: r.headers };
}

let admin;
const adminLogin = async () => (await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Admin1234' } })).body.token;

test('health and public data need no login', async () => {
  assert.equal((await api('GET', '/api/health')).body.ok, true);
  const p = (await api('GET', '/api/public')).body;
  assert.equal(p.settings.gymName, 'Habesha Fitness');
  assert.equal(p.settings.phone, '0990033483');
  assert.equal(p.plans.length, 3);
  assert.equal(p.trainers.length, 6);
  assert.equal('email' in p.trainers[0], false, 'trainer contact details must not be public');
});

test('protected routes refuse anonymous visitors', async () => {
  for (const p of ['/api/data', '/api/members', '/api/payments', '/api/auth/me']) assert.equal((await api('GET', p)).status, 401, p);
  assert.equal((await api('GET', '/api/members', { token: 'garbage' })).status, 401);
});

test('login: wrong password, unknown email, then success', async () => {
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'nope' } })).status, 401);
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'nobody@x.com', password: 'Admin1234' } })).status, 401);
  const r = await api('POST', '/api/auth/login', { body: { email: ' ADMIN@habesha.demo ', password: 'Admin1234' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.role, 'admin');
  assert.equal('hash' in r.body.user, false, 'password hash must never be returned');
  admin = r.body.token;
  assert.equal((await api('GET', '/api/auth/me', { token: admin })).body.user.email, 'admin@habesha.demo');
});

test('data snapshot has the same shape as the website DataContext', async () => {
  const d = (await api('GET', '/api/data', { token: admin })).body;
  assert.equal(d.version, 1);
  assert.equal(d.members.length, 44);
  for (const k of ['members', 'plans', 'trainers', 'payments', 'attendance']) assert.ok(Array.isArray(d[k]), k);
  assert.ok(d.attendance.length > 100);
  assert.deepEqual(Object.keys(d.notifications).sort(), ['expiry', 'newMember', 'payment', 'weekly']);
  assert.equal('users' in d || 'sessions' in d, false, 'accounts must not leak into the snapshot');
});

let visitor;
test('register creates a member account + a Pending member; members cannot open admin data', async () => {
  const bad = await api('POST', '/api/auth/register', { body: { name: 'Al', email: 'x', phone: '1', gender: '', password: 'short' } });
  assert.equal(bad.status, 400);
  assert.deepEqual(Object.keys(bad.body.details).sort(), ['email', 'gender', 'name', 'password', 'phone']);

  const r = await api('POST', '/api/auth/register', { body: { name: 'Tigist Hailu', email: 'Tigist@Example.com', phone: '0912345678', gender: 'Female', password: 'Strong123' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, 'member');
  visitor = r.body.token;

  assert.equal((await api('POST', '/api/auth/register', { body: { name: 'Tigist Hailu', email: 'tigist@example.com', phone: '0912345678', gender: 'Female', password: 'Strong123' } })).status, 409);

  const m = (await api('GET', '/api/members?q=tigist%40example', { token: admin })).body;
  assert.equal(m.total, 1);
  assert.equal(m.members[0].status, 'Pending');

  assert.equal((await api('GET', '/api/data', { token: visitor })).status, 403);
  assert.equal((await api('POST', '/api/members', { token: visitor, body: {} })).status, 403);
  assert.equal((await api('GET', '/api/auth/me', { token: visitor })).status, 200);
});

test('members: validation, duplicates, create, update, assign plan, delete', async () => {
  const e = await api('POST', '/api/members', { token: admin, body: { name: '', email: 'bad', phone: 'x', gender: 'Male' } });
  assert.equal(e.status, 400);
  assert.ok(e.body.details.name && e.body.details.email && e.body.details.phone);

  const dup = await api('POST', '/api/members', { token: admin, body: { name: 'Daniel Copy', email: 'DANIEL.BEKELE@example.com', phone: '0911111111', gender: 'Male' } });
  assert.equal(dup.status, 400);
  assert.ok(dup.body.details.email);

  const c = await api('POST', '/api/members', { token: admin, body: { name: 'Biniam Gebru', email: 'biniam@example.com', phone: '+251 911 222 333', gender: 'Male', role: 'admin', id: 'hack' } });
  assert.equal(c.status, 201);
  const m = c.body.member;
  assert.match(m.id, /^mem_/);
  assert.equal(m.status, 'Pending');
  assert.equal('role' in m, false);

  assert.equal((await api('PATCH', `/api/members/${m.id}`, { token: admin, body: { status: 'Active' } })).status, 400, 'Active needs a plan');
  const upd = await api('PATCH', `/api/members/${m.id}`, { token: admin, body: { notes: 'Prefers mornings', trainerId: 'trn_1' } });
  assert.equal(upd.body.member.trainerId, 'trn_1');
  assert.equal(upd.body.member.name, 'Biniam Gebru');

  const before = (await api('GET', '/api/payments', { token: admin })).body.total;
  const a = await api('POST', `/api/members/${m.id}/assign-plan`, { token: admin, body: { planId: 'pln_standard', method: 'Mobile Money' } });
  assert.equal(a.status, 200);
  assert.equal(a.body.member.status, 'Active');
  assert.ok(a.body.member.expiryDate > new Date().toISOString().slice(0, 10));
  assert.equal(a.body.payment.amount, 49);
  assert.equal((await api('GET', '/api/payments', { token: admin })).body.total, before + 1);
  assert.equal((await api('POST', `/api/members/${m.id}/assign-plan`, { token: admin, body: { planId: 'nope' } })).status, 404);

  // deleting a member also removes their attendance
  await api('POST', '/api/attendance/check-in', { token: admin, body: { memberId: m.id } });
  assert.equal((await api('DELETE', `/api/members/${m.id}`, { token: admin })).status, 200);
  assert.equal((await api('GET', `/api/members/${m.id}`, { token: admin })).status, 404);
  assert.equal((await api('GET', `/api/attendance?memberId=${m.id}`, { token: admin })).body.total, 0);
});

test('attendance: check in, double check-in refused, check out, delete', async () => {
  const id = 'mem_01';
  await api('PATCH', '/api/members/mem_01', { token: admin, body: {} });
  // clear any open record for today first
  for (const a of (await api('GET', `/api/attendance?memberId=${id}&open=true`, { token: admin })).body.attendance) await api('POST', `/api/attendance/${a.id}/check-out`, { token: admin });
  const c = await api('POST', '/api/attendance/check-in', { token: admin, body: { memberId: id } });
  assert.equal(c.status, 201);
  assert.equal(c.body.attendance.checkOut, null);
  assert.equal((await api('POST', '/api/attendance/check-in', { token: admin, body: { memberId: id } })).status, 409);
  const o = await api('POST', `/api/attendance/${c.body.attendance.id}/check-out`, { token: admin });
  assert.match(o.body.attendance.checkOut, /^\d\d:\d\d$/);
  assert.equal((await api('POST', `/api/attendance/${c.body.attendance.id}/check-out`, { token: admin })).status, 409);
  assert.equal((await api('DELETE', `/api/attendance/${c.body.attendance.id}`, { token: admin })).status, 200);
  assert.equal((await api('POST', '/api/attendance/check-in', { token: admin, body: { memberId: 'ghost' } })).status, 404);
});

test('trainers: CRUD and deleting un-assigns members', async () => {
  assert.equal((await api('POST', '/api/trainers', { token: admin, body: { name: 'Test Coach' } })).status, 400);
  const c = await api('POST', '/api/trainers', { token: admin, body: { name: 'Test Coach', email: 'coach@example.com', phone: '0911000111', specialization: 'Yoga', experience: '3', availability: 'Daily 6-9' } });
  assert.equal(c.status, 201);
  assert.equal(c.body.trainer.experience, 3);
  const tid = c.body.trainer.id;
  await api('PATCH', '/api/members/mem_01', { token: admin, body: { trainerId: tid } });
  assert.equal((await api('PATCH', `/api/trainers/${tid}`, { token: admin, body: { experience: 99 } })).status, 400);
  assert.equal((await api('DELETE', `/api/trainers/${tid}`, { token: admin })).status, 200);
  assert.equal((await api('GET', '/api/members/mem_01', { token: admin })).body.member.trainerId, null);
});

test('plans: CRUD, public list, deleting clears links', async () => {
  assert.equal((await api('POST', '/api/plans', { token: admin, body: { name: 'X', price: 0, durationMonths: 1, benefits: [] } })).status, 400);
  const c = await api('POST', '/api/plans', { token: admin, body: { name: 'Student', price: '19.5', durationMonths: 1, benefits: ['Gym floor', '  ', 'Lockers'] } });
  assert.equal(c.status, 201);
  assert.equal(c.body.plan.price, 19.5);
  assert.deepEqual(c.body.plan.benefits, ['Gym floor', 'Lockers']);
  const pid = c.body.plan.id;
  assert.equal((await api('GET', '/api/plans')).body.plans.length, 4);
  await api('PATCH', '/api/members/mem_01', { token: admin, body: { planId: pid } });
  await api('DELETE', `/api/plans/${pid}`, { token: admin });
  assert.equal((await api('GET', '/api/members/mem_01', { token: admin })).body.member.planId, null);
});

test('payments: validation, create, filter, update, delete', async () => {
  const bad = await api('POST', '/api/payments', { token: admin, body: { memberId: '', amount: -1, date: 'yesterday' } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.details.memberId && bad.body.details.amount && bad.body.details.date);
  const c = await api('POST', '/api/payments', { token: admin, body: { memberId: 'mem_02', amount: '25', date: '2026-11-10', method: 'Cash', status: 'Pending', note: 'x' } });
  assert.equal(c.status, 201);
  assert.equal(c.body.payment.amount, 25);
  assert.equal(c.body.payment.memberName, 'Selam Tesfaye');
  const pid = c.body.payment.id;
  const f = (await api('GET', '/api/payments?status=Pending&memberId=mem_02&from=2026-11-10&to=2026-11-10', { token: admin })).body;
  assert.ok(f.payments.some((p) => p.id === pid));
  assert.equal((await api('PATCH', `/api/payments/${pid}`, { token: admin, body: { status: 'Paid' } })).body.payment.status, 'Paid');
  assert.equal((await api('PATCH', `/api/payments/${pid}`, { token: admin, body: { status: 'Weird' } })).status, 400);
  assert.equal((await api('DELETE', `/api/payments/${pid}`, { token: admin })).status, 200);
  assert.equal((await api('POST', '/api/payments', { token: admin, body: { memberId: 'ghost', amount: 5, date: '2026-11-10' } })).status, 404);
});

test('settings (admin only), notifications, profile, password change', async () => {
  const s = await api('PATCH', '/api/settings', { token: admin, body: { phone: '0990033483', hours: 'Daily 6:00–22:00' } });
  assert.equal(s.body.settings.hours, 'Daily 6:00–22:00');
  assert.equal((await api('PATCH', '/api/settings', { token: admin, body: { email: 'nope' } })).status, 400);
  assert.equal((await api('GET', '/api/public')).body.settings.hours, 'Daily 6:00–22:00');
  assert.equal((await api('PATCH', '/api/notifications', { token: admin, body: { weekly: true, junk: 1 } })).body.notifications.weekly, true);

  const p = await api('PATCH', '/api/auth/profile', { token: admin, body: { name: 'Alex M. Morgan', role: 'member' } });
  assert.equal(p.body.user.name, 'Alex M. Morgan');
  assert.equal(p.body.user.role, 'admin', 'a user cannot change their own role');

  // change password: wrong current, weak new, success, other sessions logged out
  const other = await adminLogin();
  assert.equal((await api('POST', '/api/auth/change-password', { token: admin, body: { current: 'bad', next: 'Newpass123' } })).status, 400);
  assert.equal((await api('POST', '/api/auth/change-password', { token: admin, body: { current: 'Admin1234', next: 'short' } })).status, 400);
  assert.equal((await api('POST', '/api/auth/change-password', { token: admin, body: { current: 'Admin1234', next: 'Newpass123' } })).status, 200);
  assert.equal((await api('GET', '/api/auth/me', { token: other })).status, 401, 'other devices are logged out');
  assert.equal((await api('GET', '/api/auth/me', { token: admin })).status, 200, 'this device stays logged in');
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Admin1234' } })).status, 401);
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Newpass123' } })).status, 200);
});

test('logout invalidates the token', async () => {
  const t = (await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Newpass123' } })).body.token;
  await api('POST', '/api/auth/logout', { token: t });
  assert.equal((await api('GET', '/api/auth/me', { token: t })).status, 401);
});

test('login is rate limited', async () => {
  let last;
  for (let i = 0; i < 10; i++) last = await api('POST', '/api/auth/login', { body: { email: 'brute@force.com', password: 'x' + i } });
  assert.equal(last.status, 429);
});

test('AI chat: works through the proxy, key stays server-side, errors are hidden, rate limited', async () => {
  assert.equal((await api('GET', '/api/chat/status')).body.aiEnabled, true);
  assert.equal((await api('POST', '/api/chat/ask', { body: { message: '' } })).status, 400);
  assert.equal((await api('POST', '/api/chat/ask', { body: { message: 'x'.repeat(501) } })).status, 400);

  aiCalls = [];
  const r = await api('POST', '/api/chat/ask', { body: { message: 'What should I eat after training?', lang: 'ti', history: [{ from: 'bot', text: 'Hi' }, { from: 'user', text: 'hello' }, { from: 'bot', text: 'Hello! How can I help?' }] } });
  assert.equal(r.status, 200);
  assert.equal(r.body.answer, 'Eat protein after training.');
  assert.equal(aiCalls[0].auth, 'Bearer secret-key-123');
  const msgs = aiCalls[0].body.messages;
  assert.equal(msgs[0].role, 'system');
  assert.ok(msgs[0].content.includes('0990033483'), 'system prompt carries the live gym phone');
  assert.ok(msgs[0].content.includes('Tigrinya'));
  assert.deepEqual(msgs.slice(1).map((m) => m.role), ['user', 'assistant', 'user']);
  assert.equal(msgs.at(-1).content, 'What should I eat after training?');

  const f = await api('POST', '/api/chat/ask', { body: { message: 'FAIL please' } });
  assert.equal(f.status, 502);
  assert.equal(JSON.stringify(f.body).includes('secret-key'), false, 'upstream details must not leak');

  let last;
  for (let i = 0; i < 6; i++) last = await api('POST', '/api/chat/ask', { body: { message: 'hi ' + i } });
  assert.equal(last.status, 429);
});

test('CORS: only the website origin is allowed; bad input is rejected cleanly', async () => {
  const ok = await api('GET', '/api/health', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const no = await api('GET', '/api/health', { headers: { Origin: 'http://evil.example' } });
  assert.equal(no.headers.get('access-control-allow-origin'), null);
  const pre = await fetch(base + '/api/members', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } });
  assert.equal(pre.status, 204);

  assert.equal((await api('GET', '/api/nothing')).status, 404);
  assert.equal((await api('PUT', '/api/health')).status, 405);
  const badJson = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
  assert.equal(badJson.status, 400);
  const huge = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'x'.repeat(1_200_000) }) }).catch(() => ({ status: 413 }));
  assert.equal(huge.status, 413);
});

test('reset restores the sample data but keeps accounts and logins', async () => {
  const t = (await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Newpass123' } })).body.token;
  assert.equal((await api('POST', '/api/reset', { token: visitor })).status, 403);
  await api('POST', '/api/members', { token: t, body: { name: 'Temp Person', email: 'temp@example.com', phone: '0911000222', gender: 'Other' } });
  assert.equal((await api('POST', '/api/reset', { token: t })).status, 200);
  assert.equal((await api('GET', '/api/members?q=temp@example', { token: t })).body.total, 0);
  assert.equal((await api('GET', '/api/auth/me', { token: t })).status, 200, 'still logged in after reset');
  const d = (await api('GET', '/api/data', { token: t })).body;
  assert.equal(d.members.length, 44);
  assert.equal(d.settings.phone, '0990033483');
});

test('PostgreSQL: constraints, ordering, money, dates and passwords', async () => {
  const db = new pg.Pool({ connectionString: testUrl, max: 1 });
  const t = (await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Newpass123' } })).body.token;
  try {
    // the database itself refuses bad rows, even if the API had a bug
    await assert.rejects(db.query(`INSERT INTO members (id,name,email,phone,gender,status,join_date) VALUES ('x1','A B C','DANIEL.BEKELE@EXAMPLE.COM','1','Male','Pending',CURRENT_DATE)`), { code: '23505' });
    await assert.rejects(db.query(`INSERT INTO members (id,name,email,phone,gender,status,join_date) VALUES ('x2','A B C','n@x.com','1','Male','Weird',CURRENT_DATE)`), { code: '23514' });
    await assert.rejects(db.query(`INSERT INTO payments (id,member_id,member_name,amount,pay_date,method,status) VALUES ('p','nobody','N',5,CURRENT_DATE,'Cash','Paid')`), { code: '23503' });
    await assert.rejects(db.query(`INSERT INTO attendance (id,member_id,visit_date,check_in) VALUES ('a','mem_01',CURRENT_DATE,'10:00'),('b','mem_01',CURRENT_DATE,'11:00')`), { code: '23505' });

    // list order: seed order first, new items on top
    const first = (await api('GET', '/api/members', { token: t })).body.members.slice(0, 2).map((m) => m.id);
    assert.deepEqual(first, ['mem_01', 'mem_02']);
    const added = (await api('POST', '/api/members', { token: t, body: { name: 'Newest Person', email: 'newest@example.com', phone: '0911555666', gender: 'Female' } })).body.member;
    assert.equal((await api('GET', '/api/members', { token: t })).body.members[0].id, added.id);

    // money is a number with 2 decimals, dates are plain strings (no time-zone shift)
    const pay = (await api('POST', '/api/payments', { token: t, body: { memberId: added.id, amount: '12.345', date: '2026-01-31', method: 'Card', status: 'Paid' } })).body.payment;
    assert.equal(pay.amount, 12.35);
    assert.equal(pay.date, '2026-01-31');
    assert.equal(typeof added.joinDate, 'string');

    // a deleted member's payment history stays (member link cleared, name kept)
    await api('DELETE', `/api/members/${added.id}`, { token: t });
    const kept = (await api('GET', '/api/payments?from=2026-01-31&to=2026-01-31', { token: t })).body.payments.find((p) => p.id === pay.id);
    assert.equal(kept.memberId, null);
    assert.equal(kept.memberName, 'Newest Person');

    // passwords are stored hashed, never as text
    const { rows } = await db.query(`SELECT password_hash FROM users WHERE email = 'admin@habesha.demo'`);
    assert.ok(rows[0].password_hash.startsWith('scrypt$'));
    assert.equal(rows[0].password_hash.includes('Newpass123'), false);

    // register is all-or-nothing: a taken email changes nothing
    const counts = async () => (await db.query(`SELECT (SELECT count(*) FROM users) AS u, (SELECT count(*) FROM members) AS m`)).rows[0];
    const before = await counts();
    assert.equal((await api('POST', '/api/auth/register', { body: { name: 'Tigist Hailu', email: 'tigist@example.com', phone: '0912345678', gender: 'Female', password: 'Strong123' } })).status, 409);
    assert.deepEqual(await counts(), before);

    // expired logins are not accepted
    await db.query(`UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE email = 'admin@habesha.demo'`);
    assert.equal((await api('GET', '/api/auth/me', { token: t })).status, 401);
  } finally {
    await db.end();
  }
});

test('data survives a server restart (stored in PostgreSQL, sample data is not loaded twice)', async () => {
  const login = await api('POST', '/api/auth/login', { body: { email: 'admin@habesha.demo', password: 'Newpass123' } });
  const t = login.body.token;
  const m = (await api('POST', '/api/members', { token: t, body: { name: 'Restart Person', email: 'restart@example.com', phone: '0911777888', gender: 'Male' } })).body.member;

  server.close();
  const { closeDb } = await import('../src/db.js');
  await closeDb();
  const { createApp } = await import('../server.js');
  server = await createApp();
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;

  const all = (await api('GET', '/api/members', { token: t })).body;
  assert.equal(all.total, 45, '44 sample members + the one added; the sample data was not inserted again');
  assert.ok(all.members.some((x) => x.id === m.id));
  assert.equal((await api('GET', '/api/auth/me', { token: t })).status, 200, 'the login survived the restart');
});
