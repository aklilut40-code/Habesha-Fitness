import { route, bad, notFound, HttpError } from '../http.js';
import { query, tx, resetData } from '../db.js';
import {
  validateMember, validateTrainer, validatePlan, validatePayment, pick, PAYMENT_METHODS,
} from '../validators.js';
import { uid, todayISO, nowTime, addMonths } from '../dates.js';

// Column lists. Database columns are snake_case; `AS "camelCase"` gives the website the names it already uses.
const MEMBER = `id, name, email, phone, gender, plan_id AS "planId", trainer_id AS "trainerId", program_id AS "programId", status, join_date AS "joinDate", expiry_date AS "expiryDate", notes`;
const PLAN = `id, name, price, duration_months AS "durationMonths", popular, benefits, access`;
const TRAINER = `id, name, specialization, experience, email, phone, availability, photo, bio`;
const PAYMENT = `id, member_id AS "memberId", member_name AS "memberName", plan_id AS "planId", amount, pay_date AS "date", method, status, note`;
const ATTENDANCE = `id, member_id AS "memberId", visit_date AS "date", check_in AS "checkIn", check_out AS "checkOut"`;
const SETTINGS = `gym_name AS "gymName", email, phone, address, hours`;
const NOTIFICATIONS = `new_member AS "newMember", payment, expiry, weekly`;

// Which request fields may be written, and the column each one goes to (never taken from user input).
const MEMBER_COLS = { name: 'name', email: 'email', phone: 'phone', gender: 'gender', planId: 'plan_id', trainerId: 'trainer_id', programId: 'program_id', status: 'status', joinDate: 'join_date', expiryDate: 'expiry_date', notes: 'notes' };
const PLAN_COLS = { name: 'name', price: 'price', durationMonths: 'duration_months', popular: 'popular', benefits: 'benefits', access: 'access' };
const TRAINER_COLS = { name: 'name', specialization: 'specialization', experience: 'experience', email: 'email', phone: 'phone', availability: 'availability', photo: 'photo', bio: 'bio' };
const PAYMENT_COLS = { amount: 'amount', date: 'pay_date', method: 'method', status: 'status', note: 'note' };

const ok = (body, status = 200) => ({ status, body });
const trim = (v) => (typeof v === 'string' ? v.trim() : v);
const isISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const check = (errors) => {
  if (Object.keys(errors).length) throw bad('Please fix the highlighted fields', errors);
};
const one = (result, label) => {
  if (!result.rows.length) throw notFound(`${label} not found`);
  return result.rows[0];
};
const blankToNull = (o, keys) => { for (const k of keys) if (o[k] === '') o[k] = null; return o; };

/** UPDATE only the given fields of one row and return it (or undefined when the id does not exist). */
async function patchRow(db, table, id, colMap, values, returning) {
  const keys = Object.keys(values).filter((k) => colMap[k]);
  if (!keys.length) return (await db.query(`SELECT ${returning} FROM ${table} WHERE id = $1`, [id])).rows[0];
  const sets = keys.map((k, i) => `${colMap[k]} = $${i + 2}`);
  const { rows } = await db.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $1 RETURNING ${returning}`, [id, ...keys.map((k) => values[k])]);
  return rows[0];
}

// ======================= Public (no login) =======================
// What the landing page and the chat assistant need. Trainer contact details are not exposed.
route('GET', '/api/public', 'public', async () => {
  const [settings, plans, trainers] = await Promise.all([
    query(`SELECT ${SETTINGS} FROM settings WHERE id = 1`),
    query(`SELECT ${PLAN} FROM plans ORDER BY seq`),
    query(`SELECT id, name, specialization, experience, availability, photo, bio FROM trainers ORDER BY seq DESC`),
  ]);
  return { settings: settings.rows[0], plans: plans.rows, trainers: trainers.rows };
});

route('GET', '/api/health', 'public', async () => {
  await query('SELECT 1');
  return { ok: true, database: 'postgresql', time: new Date().toISOString() };
});

// ======================= Whole snapshot (what the React DataContext holds) =======================
route('GET', '/api/data', 'staff', async () => {
  const [members, plans, trainers, payments, attendance, settings, notifications] = await Promise.all([
    query(`SELECT ${MEMBER} FROM members ORDER BY seq DESC`),
    query(`SELECT ${PLAN} FROM plans ORDER BY seq`),
    query(`SELECT ${TRAINER} FROM trainers ORDER BY seq DESC`),
    query(`SELECT ${PAYMENT} FROM payments ORDER BY seq DESC`),
    query(`SELECT ${ATTENDANCE} FROM attendance ORDER BY seq DESC`),
    query(`SELECT ${SETTINGS} FROM settings WHERE id = 1`),
    query(`SELECT ${NOTIFICATIONS} FROM settings WHERE id = 1`),
  ]);
  return {
    version: 1, members: members.rows, plans: plans.rows, trainers: trainers.rows, payments: payments.rows,
    attendance: attendance.rows, settings: settings.rows[0], notifications: notifications.rows[0],
  };
});

route('POST', '/api/reset', 'admin', async () => {
  await resetData();
  return { ok: true };
});

// ======================= Members =======================
async function checkMemberRules(m, selfId, db = { query }) {
  const e = {};
  const dup = await db.query('SELECT 1 FROM members WHERE lower(email) = lower($1) AND id <> $2', [m.email, selfId || '']);
  if (dup.rows.length) e.email = 'A member with this email already exists';
  if (m.planId && !(await db.query('SELECT 1 FROM plans WHERE id = $1', [m.planId])).rows.length) e.planId = 'Unknown plan';
  if (m.trainerId && !(await db.query('SELECT 1 FROM trainers WHERE id = $1', [m.trainerId])).rows.length) e.trainerId = 'Unknown trainer';
  if (m.status === 'Active' && !m.planId) e.planId = 'Active members need a plan';
  if (m.expiryDate && m.joinDate && m.expiryDate < m.joinDate) e.expiryDate = 'Expiry cannot be before the join date';
  check(e);
}

route('GET', '/api/members', 'staff', async ({ query: qs }) => {
  const { rows } = await query(
    `SELECT ${MEMBER} FROM members
     WHERE ($1::text IS NULL OR status = $1::text)
       AND ($2::text IS NULL OR plan_id = $2::text)
       AND ($3::text IS NULL OR position(lower($3::text) in lower(name)) > 0
                             OR position(lower($3::text) in lower(email)) > 0
                             OR position($3::text in phone) > 0)
     ORDER BY seq DESC`,
    [qs.status || null, qs.planId || null, qs.q || null]
  );
  return { members: rows, total: rows.length };
});

route('GET', '/api/members/:id', 'staff', async ({ params }) => {
  const member = one(await query(`SELECT ${MEMBER} FROM members WHERE id = $1`, [params.id]), 'Member');
  const [payments, attendance] = await Promise.all([
    query(`SELECT ${PAYMENT} FROM payments WHERE member_id = $1 ORDER BY seq DESC`, [member.id]),
    query(`SELECT ${ATTENDANCE} FROM attendance WHERE member_id = $1 ORDER BY seq DESC`, [member.id]),
  ]);
  return { member, payments: payments.rows, attendance: attendance.rows };
});

route('POST', '/api/members', 'staff', async ({ body }) => {
  check(validateMember(body));
  const m = {
    id: uid('mem'), planId: null, trainerId: null, programId: null, status: 'Pending', expiryDate: null, notes: '',
    joinDate: todayISO(), ...pick(body, Object.keys(MEMBER_COLS)),
  };
  blankToNull(m, ['planId', 'trainerId', 'programId', 'expiryDate']);
  m.name = trim(m.name); m.email = trim(m.email); m.phone = trim(m.phone);
  await checkMemberRules(m);
  const { rows } = await query(
    `INSERT INTO members (id, name, email, phone, gender, plan_id, trainer_id, program_id, status, join_date, expiry_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ${MEMBER}`,
    [m.id, m.name, m.email, m.phone, m.gender, m.planId, m.trainerId, m.programId, m.status, m.joinDate, m.expiryDate, m.notes]
  );
  return ok({ member: rows[0] }, 201);
});

route('PATCH', '/api/members/:id', 'staff', async ({ params, body }) => {
  const cur = one(await query(`SELECT ${MEMBER} FROM members WHERE id = $1`, [params.id]), 'Member');
  check(validateMember(body, { partial: true }));
  const changes = blankToNull(pick(body, Object.keys(MEMBER_COLS)), ['planId', 'trainerId', 'programId', 'expiryDate']);
  for (const k of ['name', 'email', 'phone']) if (changes[k] !== undefined) changes[k] = trim(changes[k]);
  await checkMemberRules({ ...cur, ...changes }, cur.id);
  return { member: await patchRow({ query }, 'members', cur.id, MEMBER_COLS, changes, MEMBER) };
});

// Attendance is deleted with the member (foreign key CASCADE); payments stay as history.
route('DELETE', '/api/members/:id', 'staff', async ({ params }) => {
  one(await query('DELETE FROM members WHERE id = $1 RETURNING id', [params.id]), 'Member');
  return { ok: true };
});

// POST /api/members/:id/assign-plan { planId, recordPayment = true, method = 'Cash' }
// Sets plan, makes the member Active, extends expiry, optionally records a Paid payment (all or nothing).
route('POST', '/api/members/:id/assign-plan', 'staff', async ({ params, body }) => {
  const method = body.method ?? 'Cash';
  if (!PAYMENT_METHODS.includes(method)) throw bad('Unknown payment method', { method: 'Unknown payment method' });
  return tx(async (c) => {
    const member = one(await c.query(`SELECT ${MEMBER} FROM members WHERE id = $1 FOR UPDATE`, [params.id]), 'Member');
    const plan = one(await c.query(`SELECT ${PLAN} FROM plans WHERE id = $1`, [String(body.planId ?? '')]), 'Plan');
    const today = todayISO();
    const start = member.status === 'Active' && member.expiryDate && member.expiryDate > today ? member.expiryDate : today;
    const updated = (await c.query(
      `UPDATE members SET plan_id = $2, status = 'Active', expiry_date = $3 WHERE id = $1 RETURNING ${MEMBER}`,
      [member.id, plan.id, addMonths(start, plan.durationMonths)]
    )).rows[0];
    let payment = null;
    if (body.recordPayment !== false) {
      payment = (await c.query(
        `INSERT INTO payments (id, member_id, member_name, plan_id, amount, pay_date, method, status, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Paid',$8) RETURNING ${PAYMENT}`,
        [uid('pay'), member.id, member.name, plan.id, plan.price, today, method, `${plan.name} plan`]
      )).rows[0];
    }
    return { member: updated, payment };
  });
});

// ======================= Plans =======================
const cleanPlan = (p) => ({
  ...p,
  ...(p.name !== undefined && { name: trim(p.name) }),
  ...(p.price !== undefined && { price: Number(p.price) }),
  ...(p.durationMonths !== undefined && { durationMonths: Number(p.durationMonths) }),
  ...(p.benefits !== undefined && { benefits: p.benefits.map((b) => String(b).trim()).filter(Boolean) }),
  ...(p.access !== undefined && { access: (Array.isArray(p.access) ? p.access : []).map((b) => String(b).trim()).filter(Boolean) }),
  ...(p.popular !== undefined && { popular: !!p.popular }),
});

route('GET', '/api/plans', 'public', async () => ({ plans: (await query(`SELECT ${PLAN} FROM plans ORDER BY seq`)).rows }));

route('POST', '/api/plans', 'staff', async ({ body }) => {
  check(validatePlan(body));
  const p = { popular: false, access: [], ...cleanPlan(pick(body, Object.keys(PLAN_COLS))) };
  const { rows } = await query(
    `INSERT INTO plans (id, name, price, duration_months, popular, benefits, access) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${PLAN}`,
    [uid('pln'), p.name, p.price, p.durationMonths, p.popular, p.benefits, p.access]
  );
  return ok({ plan: rows[0] }, 201);
});

route('PATCH', '/api/plans/:id', 'staff', async ({ params, body }) => {
  one(await query('SELECT 1 FROM plans WHERE id = $1', [params.id]), 'Plan');
  check(validatePlan(body, { partial: true }));
  return { plan: await patchRow({ query }, 'plans', params.id, PLAN_COLS, cleanPlan(pick(body, Object.keys(PLAN_COLS))), PLAN) };
});

// Members on a deleted plan keep their status but lose the link (foreign key SET NULL).
route('DELETE', '/api/plans/:id', 'staff', async ({ params }) => {
  one(await query('DELETE FROM plans WHERE id = $1 RETURNING id', [params.id]), 'Plan');
  return { ok: true };
});

// ======================= Trainers =======================
route('GET', '/api/trainers', 'staff', async () => ({ trainers: (await query(`SELECT ${TRAINER} FROM trainers ORDER BY seq DESC`)).rows }));

route('POST', '/api/trainers', 'staff', async ({ body }) => {
  check(validateTrainer(body));
  const t = { photo: null, bio: '', ...pick(body, Object.keys(TRAINER_COLS)) };
  const { rows } = await query(
    `INSERT INTO trainers (id, name, specialization, experience, email, phone, availability, photo, bio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${TRAINER}`,
    [uid('trn'), trim(t.name), trim(t.specialization), Number(t.experience), trim(t.email), trim(t.phone), trim(t.availability), t.photo, t.bio]
  );
  return ok({ trainer: rows[0] }, 201);
});

route('PATCH', '/api/trainers/:id', 'staff', async ({ params, body }) => {
  one(await query('SELECT 1 FROM trainers WHERE id = $1', [params.id]), 'Trainer');
  check(validateTrainer(body, { partial: true }));
  const changes = pick(body, Object.keys(TRAINER_COLS));
  if (changes.experience !== undefined) changes.experience = Number(changes.experience);
  for (const k of ['name', 'specialization', 'email', 'phone', 'availability']) if (changes[k] !== undefined) changes[k] = trim(changes[k]);
  return { trainer: await patchRow({ query }, 'trainers', params.id, TRAINER_COLS, changes, TRAINER) };
});

// Members assigned to this trainer are left without a trainer (foreign key SET NULL).
route('DELETE', '/api/trainers/:id', 'staff', async ({ params }) => {
  one(await query('DELETE FROM trainers WHERE id = $1 RETURNING id', [params.id]), 'Trainer');
  return { ok: true };
});

// ======================= Payments (records only: no money moves) =======================
route('GET', '/api/payments', 'staff', async ({ query: qs }) => {
  for (const k of ['from', 'to']) if (qs[k] && !isISO(qs[k])) throw bad(`"${k}" must be YYYY-MM-DD`, { [k]: 'Use the format YYYY-MM-DD' });
  const { rows } = await query(
    `SELECT ${PAYMENT} FROM payments
     WHERE ($1::text IS NULL OR status = $1::text)
       AND ($2::text IS NULL OR method = $2::text)
       AND ($3::text IS NULL OR member_id = $3::text)
       AND ($4::date IS NULL OR pay_date >= $4::date)
       AND ($5::date IS NULL OR pay_date <= $5::date)
     ORDER BY seq DESC`,
    [qs.status || null, qs.method || null, qs.memberId || null, qs.from || null, qs.to || null]
  );
  return { payments: rows, total: rows.length };
});

route('POST', '/api/payments', 'staff', async ({ body }) => {
  check(validatePayment(body));
  const member = one(await query('SELECT name FROM members WHERE id = $1', [body.memberId]), 'Member');
  if (body.planId && !(await query('SELECT 1 FROM plans WHERE id = $1', [body.planId])).rows.length) throw bad('Unknown plan', { planId: 'Unknown plan' });
  const { rows } = await query(
    `INSERT INTO payments (id, member_id, member_name, plan_id, amount, pay_date, method, status, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${PAYMENT}`,
    [uid('pay'), body.memberId, member.name, body.planId || null, Number(body.amount), body.date, body.method ?? 'Cash', body.status ?? 'Paid', body.note ?? '']
  );
  return ok({ payment: rows[0] }, 201);
});

route('PATCH', '/api/payments/:id', 'staff', async ({ params, body }) => {
  one(await query('SELECT 1 FROM payments WHERE id = $1', [params.id]), 'Payment');
  check(validatePayment(body, { partial: true }));
  const changes = pick(body, Object.keys(PAYMENT_COLS));
  if (changes.amount !== undefined) changes.amount = Number(changes.amount);
  return { payment: await patchRow({ query }, 'payments', params.id, PAYMENT_COLS, changes, PAYMENT) };
});

route('DELETE', '/api/payments/:id', 'staff', async ({ params }) => {
  one(await query('DELETE FROM payments WHERE id = $1 RETURNING id', [params.id]), 'Payment');
  return { ok: true };
});

// ======================= Attendance =======================
route('GET', '/api/attendance', 'staff', async ({ query: qs }) => {
  if (qs.date && !isISO(qs.date)) throw bad('"date" must be YYYY-MM-DD', { date: 'Use the format YYYY-MM-DD' });
  const { rows } = await query(
    `SELECT ${ATTENDANCE} FROM attendance
     WHERE ($1::date IS NULL OR visit_date = $1::date)
       AND ($2::text IS NULL OR member_id = $2::text)
       AND ($3::boolean IS NOT TRUE OR check_out IS NULL)
     ORDER BY seq DESC`,
    [qs.date || null, qs.memberId || null, qs.open === 'true' ? true : null]
  );
  return { attendance: rows, total: rows.length };
});

// POST /api/attendance/check-in { memberId } (the database allows one open visit per member per day)
route('POST', '/api/attendance/check-in', 'staff', async ({ body }) => {
  const member = one(await query('SELECT id, name FROM members WHERE id = $1', [String(body.memberId ?? '')]), 'Member');
  try {
    const { rows } = await query(
      `INSERT INTO attendance (id, member_id, visit_date, check_in) VALUES ($1, $2, $3, $4) RETURNING ${ATTENDANCE}`,
      [uid('att'), member.id, todayISO(), nowTime()]
    );
    return ok({ attendance: rows[0] }, 201);
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, `${member.name} is already checked in`);
    throw err;
  }
});

route('POST', '/api/attendance/:id/check-out', 'staff', async ({ params }) => {
  const { rows } = await query(`UPDATE attendance SET check_out = $2 WHERE id = $1 AND check_out IS NULL RETURNING ${ATTENDANCE}`, [params.id, nowTime()]);
  if (rows.length) return { attendance: rows[0] };
  one(await query('SELECT 1 FROM attendance WHERE id = $1', [params.id]), 'Attendance record');
  throw new HttpError(409, 'Already checked out');
});

route('DELETE', '/api/attendance/:id', 'staff', async ({ params }) => {
  one(await query('DELETE FROM attendance WHERE id = $1 RETURNING id', [params.id]), 'Attendance record');
  return { ok: true };
});

// ======================= Settings & notifications =======================
route('GET', '/api/settings', 'staff', async () => ({
  settings: (await query(`SELECT ${SETTINGS} FROM settings WHERE id = 1`)).rows[0],
  notifications: (await query(`SELECT ${NOTIFICATIONS} FROM settings WHERE id = 1`)).rows[0],
}));

route('PATCH', '/api/settings', 'admin', async ({ body }) => {
  const e = {};
  const s = pick(body, ['gymName', 'email', 'phone', 'address', 'hours']);
  for (const [k, v] of Object.entries(s)) if (typeof v !== 'string' || !v.trim()) e[k] = 'Required';
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email)) e.email = 'Enter a valid email address';
  if (s.phone && !/^\+?[0-9\s\-()]{7,18}$/.test(s.phone)) e.phone = 'Enter a valid phone number';
  check(e);
  const cols = { gymName: 'gym_name', email: 'email', phone: 'phone', address: 'address', hours: 'hours' };
  const keys = Object.keys(s);
  if (keys.length) {
    await query(`UPDATE settings SET ${keys.map((k, i) => `${cols[k]} = $${i + 1}`).join(', ')} WHERE id = 1`, keys.map((k) => s[k].trim()));
  }
  return { settings: (await query(`SELECT ${SETTINGS} FROM settings WHERE id = 1`)).rows[0] };
});

route('PATCH', '/api/notifications', 'staff', async ({ body }) => {
  const cols = { newMember: 'new_member', payment: 'payment', expiry: 'expiry', weekly: 'weekly' };
  const keys = Object.keys(cols).filter((k) => typeof body[k] === 'boolean');
  if (keys.length) {
    await query(`UPDATE settings SET ${keys.map((k, i) => `${cols[k]} = $${i + 1}`).join(', ')} WHERE id = 1`, keys.map((k) => body[k]));
  }
  return { notifications: (await query(`SELECT ${NOTIFICATIONS} FROM settings WHERE id = 1`)).rows[0] };
});
