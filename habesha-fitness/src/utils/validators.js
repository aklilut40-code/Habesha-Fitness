export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());
export const isPhone = (v) => /^\+?[0-9\s\-()]{7,18}$/.test((v || '').trim());

export function required(v, label) {
  return String(v ?? '').trim() ? '' : `${label} is required`;
}

export function validateMember(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Full name is required';
  else if (f.name.trim().length < 3) e.name = 'Enter at least 3 characters';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!isEmail(f.email)) e.email = 'Enter a valid email address';
  if (!f.phone.trim()) e.phone = 'Phone number is required';
  else if (!isPhone(f.phone)) e.phone = 'Enter a valid phone number';
  if (!f.gender) e.gender = 'Select a gender';
  return e;
}

export function validateTrainer(f) {
  const e = validateMember({ ...f, gender: 'x' });
  delete e.gender;
  if (!f.specialization.trim()) e.specialization = 'Specialization is required';
  const exp = Number(f.experience);
  if (f.experience === '' || Number.isNaN(exp) || exp < 0 || exp > 60) e.experience = 'Enter years between 0 and 60';
  if (!f.availability.trim()) e.availability = 'Availability is required';
  return e;
}

export function validatePlan(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Plan name is required';
  const price = Number(f.price);
  if (f.price === '' || Number.isNaN(price) || price <= 0) e.price = 'Enter a price greater than 0';
  const months = Number(f.durationMonths);
  if (!Number.isInteger(months) || months < 1 || months > 36) e.durationMonths = 'Enter 1–36 months';
  const benefits = f.benefits.split('\n').map((s) => s.trim()).filter(Boolean);
  if (benefits.length < 1) e.benefits = 'Add at least one benefit (one per line)';
  return e;
}

export function validatePayment(f) {
  const e = {};
  if (!f.memberId) e.memberId = 'Select a member';
  const amt = Number(f.amount);
  if (f.amount === '' || Number.isNaN(amt) || amt <= 0) e.amount = 'Enter an amount greater than 0';
  if (!f.date) e.date = 'Select a date';
  return e;
}

export function passwordIssue(pw) {
  if (!pw || pw.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Include both letters and numbers';
  return '';
}
