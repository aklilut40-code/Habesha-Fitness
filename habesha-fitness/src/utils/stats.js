import { addDays, lastMonths, monthKey, monthLabel, todayISO } from './format';

export const inRange = (iso, from, to) => (!from || iso >= from) && (!to || iso <= to);

export function revenueByMonth(payments, months) {
  const map = Object.fromEntries(months.map((m) => [m, 0]));
  payments.forEach((p) => {
    if (p.status === 'Paid' && map[monthKey(p.date)] !== undefined) map[monthKey(p.date)] += p.amount;
  });
  return months.map((m) => ({ label: monthLabel(m), key: m, value: map[m] }));
}

export function membersByMonth(members, months) {
  const first = months[0];
  let running = members.filter((m) => monthKey(m.joinDate) < first).length;
  return months.map((m) => {
    running += members.filter((x) => monthKey(x.joinDate) === m).length;
    return { label: monthLabel(m), key: m, value: running };
  });
}

export function joinsPerMonth(members, months) {
  return months.map((m) => ({ label: monthLabel(m), key: m, value: members.filter((x) => monthKey(x.joinDate) === m).length }));
}

export function visitsByDay(attendance, from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    out.push({ date: d, label: d.slice(5).replace('-', '/'), value: attendance.filter((a) => a.date === d).length });
    if (out.length > 400) break;
  }
  return out;
}

export function visitsByWeekday(attendance) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  attendance.forEach((a) => {
    counts[new Date(`${a.date}T00:00:00`).getDay()] += 1;
  });
  return [1, 2, 3, 4, 5, 6, 0].map((i) => ({ label: names[i], value: counts[i] }));
}

export const monthsBack = (n) => lastMonths(n, todayISO());
