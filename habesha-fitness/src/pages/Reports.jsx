import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import HBarList from '../components/charts/HBarList';
import { Input } from '../components/ui/Field';
import { useData } from '../store/DataContext';
import { addDays, money, monthKey, monthLabel, number, parseISO, todayISO, daysBetween, pad } from '../utils/format';
import { inRange, membersByMonth, revenueByMonth, visitsByDay, visitsByWeekday } from '../utils/stats';

function monthsBetween(from, to) {
  const out = [];
  const a = parseISO(from);
  const b = parseISO(to);
  const d = new Date(a.getFullYear(), a.getMonth(), 1);
  while (d <= b && out.length < 36) {
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

const PRESETS = [
  ['30 days', 29],
  ['3 months', 89],
  ['6 months', 181],
  ['12 months', 364],
];

export default function Reports() {
  const { payments, members, attendance, plans } = useData();
  const today = todayISO();
  const [from, setFrom] = useState(addDays(today, -181));
  const [to, setTo] = useState(today);
  const span = daysBetween(from, to);

  const d = useMemo(() => {
    const months = monthsBetween(from, to);
    const pays = payments.filter((p) => inRange(p.date, from, to));
    const paid = pays.filter((p) => p.status === 'Paid');
    const att = attendance.filter((a) => inRange(a.date, from, to));
    const methods = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer'].map((m) => ({ label: m, value: paid.filter((p) => p.method === m).reduce((a, p) => a + p.amount, 0) })).sort((a, b) => b.value - a.value);
    return {
      revenue: revenueByMonth(paid, months),
      growth: membersByMonth(members.filter((m) => m.joinDate <= to), months),
      weekday: visitsByWeekday(att),
      daily: span <= 45 ? visitsByDay(att, from, to) : null,
      byPlan: plans.map((p) => ({ label: p.name, value: members.filter((m) => m.planId === p.id && m.status === 'Active').length })),
      byStatus: ['Active', 'Pending', 'Expired'].map((s) => ({ label: s, value: members.filter((m) => m.status === s).length })),
      methods,
      totalPaid: paid.reduce((a, p) => a + p.amount, 0),
      pending: pays.filter((p) => p.status === 'Pending').reduce((a, p) => a + p.amount, 0),
      failed: pays.filter((p) => p.status === 'Failed').reduce((a, p) => a + p.amount, 0),
      visits: att.length,
      newMembers: members.filter((m) => inRange(m.joinDate, from, to)).length,
      txCount: pays.length,
    };
  }, [payments, members, attendance, plans, from, to, span]);

  const money0 = (v, axis) => (axis ? (v >= 1000 ? `$${v / 1000}k` : `$${v}`) : money(v));
  const hasData = d.txCount + d.visits + d.newMembers > 0;

  return (
    <div className="stack">
      <PageHeader title="Reports & analytics" subtitle={`${monthLabel(monthKey(from), true)} – ${monthLabel(monthKey(to), true)}`}>
        <div className="segmented scroll-x" role="group" aria-label="Quick ranges">
          {PRESETS.map(([l, n]) => (<button key={l} type="button" className={from === addDays(today, -n) && to === today ? 'on' : ''} onClick={() => { setFrom(addDays(today, -n)); setTo(today); }}>{l}</button>))}
        </div>
        <div className="date-range">
          <Input aria-label="From date" type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          <span>to</span>
          <Input aria-label="To date" type="date" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} />
        </div>
      </PageHeader>

      <div className="stats-4">
        <StatCard icon="wallet" tone="green" label="Revenue collected" value={money(d.totalPaid)} hint={`${d.txCount} transactions`} />
        <StatCard icon="users" label="New members" value={number(d.newMembers)} />
        <StatCard icon="calcheck" tone="blue" label="Total visits" value={number(d.visits)} hint={span >= 0 ? `${(d.visits / Math.max(span + 1, 1)).toFixed(1)} per day` : ''} />
        <StatCard icon="alert" tone="warn" label="Pending / failed" value={money(d.pending + d.failed)} />
      </div>

      {!hasData ? (
        <EmptyState icon="chart" title="No data in this range" text="Pick a wider date range to see reports." />
      ) : (
        <>
          <div className="grid-main">
            <Card title="Monthly revenue" subtitle="Paid payments"><LineChart data={d.revenue} format={money0} name="Monthly revenue" /></Card>
            <Card title="Member growth" subtitle="Cumulative members by month"><LineChart data={d.growth} name="Member growth" color="#3987e5" format={(v) => number(Math.round(v))} /></Card>
          </div>
          <div className="grid-main">
            <Card title={d.daily ? 'Daily attendance' : 'Attendance by weekday'} subtitle={d.daily ? 'Check-ins per day' : 'Total check-ins in range'}>
              <BarChart data={d.daily || d.weekday} name="Attendance" />
            </Card>
            <Card title="Membership distribution" subtitle="Active members by plan"><DonutChart data={d.byPlan} centerLabel="Active" /></Card>
          </div>
          <div className="grid-2-eq">
            <Card title="Payment summary" subtitle="Collected by method"><HBarList data={d.methods} format={(v) => money(v)} /></Card>
            <Card title="Member status" subtitle="All members"><DonutChart data={d.byStatus} centerLabel="Members" /></Card>
          </div>
        </>
      )}
    </div>
  );
}
