import { addDays, addMonths, daysBetween, todayISO, pad } from '../utils/format';

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  ['Daniel Bekele', 'M'], ['Selam Tesfaye', 'F'], ['Marcus Johnson', 'M'], ['Hanna Girma', 'F'], ['Luca Romano', 'M'],
  ['Amira Hassan', 'F'], ['Yonas Haile', 'M'], ['Sara Mekonnen', 'F'], ['Tomas Novak', 'M'], ['Liya Abebe', 'F'],
  ['Kevin Brooks', 'M'], ['Meron Desta', 'F'], ['Ibrahim Yusuf', 'M'], ['Chloe Martin', 'F'], ['Dawit Alemu', 'M'],
  ['Rahel Kidane', 'F'], ['Samuel Okafor', 'M'], ['Nardos Wolde', 'F'], ['Oliver Grant', 'M'], ['Bethlehem Assefa', 'F'],
  ['Mikael Tadesse', 'M'], ['Tigist Lemma', 'F'], ['Jamal Carter', 'M'], ['Eden Gebre', 'F'], ['Andre Silva', 'M'],
  ['Hiwot Bekri', 'F'], ['Noah Peterson', 'M'], ['Saron Yohannes', 'F'], ['Elias Mulugeta', 'M'], ['Kidist Negash', 'F'],
  ['Victor Ramos', 'M'], ['Feven Tsegaye', 'F'], ['Henok Berhane', 'M'], ['Zara Ahmed', 'F'], ['Ethan Walker', 'M'],
  ['Mahlet Zerihun', 'F'], ['Abel Teklu', 'M'], ['Rediet Solomon', 'F'], ['Leo Fischer', 'M'], ['Winta Gebremedhin', 'F'],
  ['Robel Fikre', 'M'], ['Naomi Clarke', 'F'], ['Biruk Taye', 'M'], ['Helen Worku', 'F'],
];

const METHODS = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer'];

export function buildSeed() {
  const rand = rng(20261112);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const today = todayISO();

  const plans = [
    { id: 'pln_basic', name: 'Basic', price: 29, durationMonths: 1, popular: false,
      benefits: ['Full gym floor access', 'Locker room & showers', 'Free orientation session', 'Access to open cardio zone'],
      access: ['Mon–Fri 6:00–22:00', 'Weekends 8:00–18:00'] },
    { id: 'pln_standard', name: 'Standard', price: 49, durationMonths: 1, popular: true,
      benefits: ['Everything in Basic', 'Unlimited group classes', 'Monthly body composition scan', 'Workout program of your choice', '1 guest pass per month'],
      access: ['Daily 5:00–23:00', 'Group class studio'] },
    { id: 'pln_premium', name: 'Premium', price: 89, durationMonths: 1, popular: false,
      benefits: ['Everything in Standard', '4 personal training sessions / month', 'Nutrition coaching plan', 'Sauna & recovery lounge', 'Priority class booking', 'Free towel service'],
      access: ['24/7 access', 'Sauna & recovery lounge', 'Private training zone'] },
  ];

  const trainers = [
    { id: 'trn_1', name: 'Marcus Reed', specialization: 'Bodybuilding & Hypertrophy', experience: 12, email: 'marcus.reed@habesha.demo', phone: '+251 911 200 101', availability: 'Mon–Fri, 6:00–14:00', photo: 'hero', bio: 'Former regional competitor focused on contest prep, symmetry and smart progressive overload.' },
    { id: 'trn_2', name: 'Amara Okoye', specialization: 'Strength & Physique', experience: 9, email: 'amara.okoye@habesha.demo', phone: '+251 911 200 102', availability: 'Tue–Sat, 8:00–16:00', photo: 'fitness', bio: 'Strength coach who builds confident lifters with technique-first programming.' },
    { id: 'trn_3', name: 'Daniel Kovac', specialization: 'Personal Training & Fat Loss', experience: 7, email: 'daniel.kovac@habesha.demo', phone: '+251 911 200 103', availability: 'Mon–Sat, 10:00–19:00', photo: 'training', bio: 'Practical coach for busy people who want visible results without gimmicks.' },
    { id: 'trn_4', name: 'Samson Teklu', specialization: 'Powerlifting & Conditioning', experience: 10, email: 'samson.teklu@habesha.demo', phone: '+251 911 200 104', availability: 'Mon–Fri, 14:00–22:00', photo: 'workout', bio: 'Heavy-lifting specialist who coaches squat, bench and deadlift for every level.' },
    { id: 'trn_5', name: 'Lena Fischer', specialization: 'Cardio & Mobility', experience: 6, email: 'lena.fischer@habesha.demo', phone: '+251 911 200 105', availability: 'Daily, 6:00–12:00', photo: null, bio: 'Endurance and mobility coach running the morning group classes.' },
    { id: 'trn_6', name: 'Yared Mengistu', specialization: 'Beginner Coaching', experience: 4, email: 'yared.mengistu@habesha.demo', phone: '+251 911 200 106', availability: 'Mon–Fri, 16:00–21:00', photo: null, bio: 'Patient, friendly coach who helps first-timers build safe habits.' },
  ];

  const programIds = ['prg_muscle', 'prg_loss', 'prg_strength', 'prg_cardio', 'prg_beginner', 'prg_advanced'];

  const members = NAMES.map(([name, g], i) => {
    const first = name.split(' ')[0].toLowerCase();
    const last = name.split(' ')[1].toLowerCase();
    const r = rand();
    const status = i < 5 ? (i < 3 ? 'Pending' : 'Active') : r < 0.68 ? 'Active' : r < 0.9 ? 'Expired' : 'Pending';
    const joinAgo = status === 'Pending' ? between(0, 9) : i < 5 ? between(0, 20) : between(10, 340);
    const joinDate = addDays(today, -joinAgo);
    const pr = rand();
    const planId = status === 'Pending' ? null : pr < 0.34 ? 'pln_basic' : pr < 0.76 ? 'pln_standard' : 'pln_premium';
    let expiryDate = null;
    if (status === 'Active') expiryDate = addDays(today, between(3, 29));
    if (status === 'Expired') expiryDate = addDays(today, -between(2, 70));
    return {
      id: `mem_${pad(i + 1)}`,
      name,
      email: `${first}.${last}@example.com`,
      phone: `+251 9${between(10, 99)} ${between(100, 999)} ${between(100, 999)}`,
      gender: g === 'M' ? 'Male' : 'Female',
      planId,
      trainerId: status === 'Pending' ? null : rand() < 0.65 ? pick(trainers).id : null,
      programId: status === 'Pending' || rand() < 0.45 ? null : pick(programIds),
      status,
      joinDate,
      expiryDate,
      notes: '',
    };
  });

  // Payments: one per month since joining (paid members only), plus a few pending/failed.
  const payments = [];
  let pn = 1;
  members.forEach((m) => {
    if (!m.planId) return;
    const plan = plans.find((p) => p.id === m.planId);
    const lastPay = m.status === 'Active' ? addMonths(m.expiryDate, -1) : addMonths(m.expiryDate, -1);
    let d = m.joinDate;
    let guard = 0;
    while (daysBetween(d, lastPay) >= 0 && guard++ < 14) {
      if (daysBetween(d, today) >= 0) {
        payments.push({
          id: `pay_${String(pn++).padStart(4, '0')}`,
          memberId: m.id,
          memberName: m.name,
          planId: m.planId,
          amount: plan.price,
          date: d,
          method: pick(METHODS),
          status: 'Paid',
          note: 'Membership renewal',
        });
      }
      d = addMonths(d, 1);
    }
  });
  // A few non-paid ones for realism
  [6, 11, 19].forEach((idx, k) => {
    const m = members.filter((x) => x.planId)[idx];
    if (!m) return;
    const plan = plans.find((p) => p.id === m.planId);
    payments.push({
      id: `pay_${String(pn++).padStart(4, '0')}`,
      memberId: m.id, memberName: m.name, planId: m.planId, amount: plan.price,
      date: addDays(today, -k - 1), method: k === 1 ? 'Card' : 'Bank Transfer',
      status: k === 1 ? 'Failed' : 'Pending', note: k === 1 ? 'Card declined' : 'Awaiting confirmation',
    });
  });
  payments.sort((a, b) => b.date.localeCompare(a.date));

  // Attendance for the last 30 days.
  const attendance = [];
  let an = 1;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const active = members.filter((m) => m.status === 'Active' || m.status === 'Expired');
  for (let back = 29; back >= 0; back--) {
    const date = addDays(today, -back);
    const dow = new Date(date + 'T00:00:00').getDay();
    const chance = dow === 0 ? 0.18 : dow === 6 ? 0.3 : 0.42;
    active.forEach((m) => {
      if (m.joinDate > date) return;
      if (m.expiryDate && m.expiryDate < date) return;
      if (rand() > chance) return;
      const inMin = between(6 * 60, 20 * 60 + 30);
      if (back === 0 && inMin > nowMin - 5) return;
      const dur = between(45, 120);
      const outMin = inMin + dur;
      const open = back === 0 && outMin > nowMin;
      const hm = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
      attendance.push({ id: `att_${String(an++).padStart(5, '0')}`, memberId: m.id, date, checkIn: hm(inMin), checkOut: open ? null : hm(Math.min(outMin, 23 * 60 + 30)) });
    });
  }
  attendance.sort((a, b) => (b.date + b.checkIn).localeCompare(a.date + a.checkIn));

  return {
    version: 1,
    members,
    plans,
    trainers,
    payments,
    attendance,
    settings: {
      gymName: 'Habesha Fitness',
      email: 'hello@habesha.demo',
      phone: '0990033483',
      address: 'Near Romanat Square, Mekelle, Tigray, Ethiopia',
      hours: 'Mon–Fri 5:00–23:00 · Sat–Sun 7:00–20:00',
    },
    notifications: { newMember: true, payment: true, expiry: true, weekly: false },
  };
}
