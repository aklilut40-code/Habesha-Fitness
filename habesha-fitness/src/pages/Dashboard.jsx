import { useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import { Link, navigate } from '../store/router';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { addDays, daysBetween, formatDate, formatTime, money, number, todayISO } from '../utils/format';
import { monthsBack, revenueByMonth, visitsByDay } from '../utils/stats';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { members, trainers, payments, plans, attendance } = useData();
  const { user } = useAuth();
  const [range, setRange] = useState(6);
  const today = todayISO();

  const s = useMemo(() => {
    const active = members.filter((m) => m.status === 'Active');
    const thisMonth = today.slice(0, 7);
    const lastMonth = monthsBack(2)[0];
    const rev = (k) => payments.filter((p) => p.status === 'Paid' && p.date.startsWith(k)).reduce((a, p) => a + p.amount, 0);
    const cur = rev(thisMonth);
    const prev = rev(lastMonth);
    const todays = attendance.filter((a) => a.date === today);
    const expiring = active.filter((m) => m.expiryDate && daysBetween(today, m.expiryDate) <= 7).length;
    return {
      active: active.length,
      cur,
      delta: prev ? Math.round(((cur - prev) / prev) * 100) : 0,
      todays: todays.length,
      inside: todays.filter((a) => !a.checkOut).length,
      expiring,
    };
  }, [members, payments, attendance, today]);

  const revenue = useMemo(() => revenueByMonth(payments, monthsBack(range)), [payments, range]);
  const week = useMemo(() => visitsByDay(attendance, addDays(today, -6), today).map((d) => ({ ...d, label: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }) })), [attendance, today]);
  const byPlan = useMemo(
    () => plans.map((p) => ({ label: p.name, value: members.filter((m) => m.planId === p.id && m.status === 'Active').length })),
    [plans, members]
  );
  const recentPay = payments.slice(0, 5);
  const recentMembers = useMemo(() => [...members].sort((a, b) => b.joinDate.localeCompare(a.joinDate)).slice(0, 5), [members]);
  const nameOf = (p) => members.find((m) => m.id === p.memberId)?.name || p.memberName;

  const quick = [
    { label: 'Add member', icon: 'users', to: '/app/members?new=1' },
    { label: 'Record payment', icon: 'wallet', to: '/app/payments?new=1' },
    { label: 'Check in member', icon: 'login', to: '/app/attendance?new=1' },
    { label: 'Add trainer', icon: 'dumbbell', to: '/app/trainers?new=1' },
  ];

  return (
    <div className="stack">
      <section className="welcome">
        <div>
          <span className="eyebrow">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>
            {number(s.inside)} {s.inside === 1 ? 'member is' : 'members are'} training right now
            {s.expiring > 0 ? <> · <Link to="/app/members">{s.expiring} membership{s.expiring > 1 ? 's' : ''} expiring within 7 days</Link></> : null}.
          </p>
        </div>
        <div className="quick">
          {quick.map((q) => (
            <Button key={q.label} variant="outline" size="sm" icon={q.icon} onClick={() => navigate(q.to)}>{q.label}</Button>
          ))}
        </div>
      </section>

      <div className="stats-4">
        <StatCard icon="users" label="Total members" value={number(members.length)} hint={`${members.filter((m) => m.status === 'Pending').length} pending approval`} />
        <StatCard icon="checkcircle" tone="green" label="Active memberships" value={number(s.active)} hint={`${Math.round((s.active / Math.max(members.length, 1)) * 100)}% of members`} />
        <StatCard icon="dumbbell" tone="blue" label="Total trainers" value={number(trainers.length)} hint="Coaching staff" />
        <StatCard icon="wallet" tone="accent" label="Monthly revenue" value={money(s.cur)} hint="This month so far" />
      </div>

      <div className="grid-main">
        <Card
          title="Revenue"
          subtitle="Paid payments per month · current month is to date"
          action={
            <div className="segmented" role="group" aria-label="Revenue range">
              {[6, 12].map((n) => (
                <button key={n} type="button" className={range === n ? 'on' : ''} onClick={() => setRange(n)}>{n}M</button>
              ))}
            </div>
          }
        >
          <LineChart data={revenue} name="Monthly revenue" format={(v, axis) => (axis ? (v >= 1000 ? `$${v / 1000}k` : `$${v}`) : money(v))} />
        </Card>
        <Card title="Active memberships" subtitle="By plan">
          <DonutChart data={byPlan} centerLabel="Active" />
        </Card>
      </div>

      <div className="grid-main">
        <Card title="Attendance overview" subtitle="Check-ins in the last 7 days" action={<Badge tone="info">{s.todays} today</Badge>}>
          <BarChart data={week} name="Daily check-ins" highlightLast />
        </Card>
        <Card title="Recent registrations" action={<Link to="/app/members" className="link-btn">View all</Link>} pad={false}>
          {recentMembers.length === 0 ? (
            <EmptyState icon="users" title="No members yet" />
          ) : (
            <ul className="list">
              {recentMembers.map((m) => (
                <li key={m.id}>
                  <Avatar name={m.name} size={38} />
                  <div className="list-main"><b>{m.name}</b><small>Joined {formatDate(m.joinDate, { day: 'numeric', month: 'short' })}</small></div>
                  <Badge>{m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent payments" action={<Link to="/app/payments" className="link-btn">View all</Link>} pad={false}>
        {recentPay.length === 0 ? (
          <EmptyState icon="wallet" title="No payments yet" />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Member</th><th className="hide-sm">Method</th><th className="hide-sm">Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentPay.map((p) => (
                  <tr key={p.id}>
                    <td><div className="cell-user"><Avatar name={nameOf(p)} size={30} /><span>{nameOf(p)}</span></div></td>
                    <td className="hide-sm">{p.method}</td>
                    <td className="hide-sm">{formatDate(p.date)}</td>
                    <td><b>{money(p.amount)}</b></td>
                    <td><Badge>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
