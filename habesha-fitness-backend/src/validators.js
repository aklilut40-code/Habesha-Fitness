// Same rules as the frontend (src/utils/validators.js), now enforced on the server too.
// Each validator returns an object of { field: message }. Empty object = valid.
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
export const isPhone = (v) => /^\+?[0-9\s\-()]{7,18}$/.test(String(v || '').trim());
const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const isISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export const GENDERS = ['Male', 'Female', 'Other'];
export const MEMBER_STATUSES = ['Active', 'Pending', 'Expired'];
export const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer'];
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed'];

export function validateMember(f, { partial = false } = {}) {
  const e = {};
  const need = (k) => !partial || f[k] !== undefined;
  if (need('name')) {
    const n = str(f.name).trim();
    if (!n) e.name = 'Full name is required';
    else if (n.length < 3) e.name = 'Enter at least 3 characters';
    else if (n.length > 80) e.name = 'Name is too long';
  }
  if (need('email')) {
    if (!str(f.email).trim()) e.email = 'Email is required';
    else if (!isEmail(f.email)) e.email = 'Enter a valid email address';
  }
  if (need('phone')) {
    if (!str(f.phone).trim()) e.phone = 'Phone number is required';
    else if (!isPhone(f.phone)) e.phone = 'Enter a valid phone number';
  }
  if (need('gender') && !GENDERS.includes(f.gender)) e.gender = 'Select a gender';
  if (f.status !== undefined && !MEMBER_STATUSES.includes(f.status)) e.status = 'Status must be Active, Pending or Expired';
  for (const k of ['joinDate', 'expiryDate']) {
    if (f[k] !== undefined && f[k] !== null && f[k] !== '' && !isISO(f[k])) e[k] = 'Use the format YYYY-MM-DD';
  }
  if (f.notes !== undefined && str(f.notes).length > 1000) e.notes = 'Notes are too long';
  return e;
}

export function validateTrainer(f, { partial = false } = {}) {
  const e = validateMember({ ...f, gender: 'Other' }, { partial });
  delete e.gender;
  const need = (k) => !partial || f[k] !== undefined;
  if (need('specialization') && !str(f.specialization).trim()) e.specialization = 'Specialization is required';
  if (need('experience')) {
    const exp = Number(f.experience);
    if (f.experience === '' || f.experience == null || Number.isNaN(exp) || exp < 0 || exp > 60) e.experience = 'Enter years between 0 and 60';
  }
  if (need('availability') && !str(f.availability).trim()) e.availability = 'Availability is required';
  return e;
}

export function validatePlan(f, { partial = false } = {}) {
  const e = {};
  const need = (k) => !partial || f[k] !== undefined;
  if (need('name') && !str(f.name).trim()) e.name = 'Plan name is required';
  if (need('price')) {
    const p = Number(f.price);
    if (f.price === '' || f.price == null || Number.isNaN(p) || p <= 0) e.price = 'Enter a price greater than 0';
  }
  if (need('durationMonths')) {
    const m = Number(f.durationMonths);
    if (!Number.isInteger(m) || m < 1 || m > 36) e.durationMonths = 'Enter 1–36 months';
  }
  if (need('benefits')) {
    if (!Array.isArray(f.benefits) || f.benefits.map(str).map((s) => s.trim()).filter(Boolean).length < 1) e.benefits = 'Add at least one benefit';
  }
  return e;
}

export function validatePayment(f, { partial = false } = {}) {
  const e = {};
  const need = (k) => !partial || f[k] !== undefined;
  if (need('memberId') && !f.memberId) e.memberId = 'Select a member';
  if (need('amount')) {
    const a = Number(f.amount);
    if (f.amount === '' || f.amount == null || Number.isNaN(a) || a <= 0) e.amount = 'Enter an amount greater than 0';
  }
  if (need('date') && !isISO(str(f.date))) e.date = 'Select a date (YYYY-MM-DD)';
  if (f.method !== undefined && !PAYMENT_METHODS.includes(f.method)) e.method = 'Unknown payment method';
  if (f.status !== undefined && !PAYMENT_STATUSES.includes(f.status)) e.status = 'Status must be Paid, Pending or Failed';
  return e;
}

export function passwordIssue(pw) {
  if (!pw || pw.length < 8) return 'Use at least 8 characters';
  if (pw.length > 128) return 'Password is too long';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Include both letters and numbers';
  return '';
}

// Keep only the listed keys (stops callers from setting fields like "id" or "role").
export const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
