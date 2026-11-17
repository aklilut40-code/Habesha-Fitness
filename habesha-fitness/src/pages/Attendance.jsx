import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button, { IconButton } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Table from '../components/ui/Table';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select, SearchBox } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { useQueryAction } from '../store/router';
import { addDays, formatDate, formatTime, todayISO } from '../utils/format';

export default function Attendance() {
  const { members, attendance, checkIn, checkOut, deleteAttendance } = useData();
  const toast = useToast();
  const today = todayISO();
  const [q, setQ] = useState('');
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);
  const [modal, setModal] = useState(null); // { memberId, error }
  const [del, setDel] = useState(null);

  useQueryAction('new', () => setModal({ memberId: '' }));

  const byId = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const todays = attendance.filter((a) => a.date === today);
  const inside = todays.filter((a) => !a.checkOut);
  const activeMembers = members.filter((m) => m.status === 'Active');
  const presentIds = new Set(todays.map((a) => a.memberId));
  const absent = activeMembers.filter((m) => !presentIds.has(m.id)).length;

  const history = useMemo(() => {
    const n = q.trim().toLowerCase();
    return attendance.filter((a) => a.date >= from && a.date <= to && (!n || (byId[a.memberId]?.name || '').toLowerCase().includes(n)));
  }, [attendance, from, to, q, byId]);

  const doCheckIn = () => {
    const m = byId[modal.memberId];
    if (!m) return setModal({ ...modal, error: 'Select a member' });
    if (m.status !== 'Active') return setModal({ ...modal, error: `${m.name}'s membership is ${m.status.toLowerCase()}. Renew it first.` });
    if (inside.some((a) => a.memberId === m.id)) return setModal({ ...modal, error: `${m.name} is already checked in.` });
    checkIn(m.id);
    toast.success(`${m.name} checked in.`);
    setModal(null);
  };

  const columns = [
    { key: 'm', header: 'Member', render: (a) => { const m = byId[a.memberId]; return <div className="cell-user"><Avatar name={m?.name || '?'} size={32} /><b>{m?.name || 'Deleted member'}</b></div>; } },
    { key: 'd', header: 'Date', render: (a) => formatDate(a.date) },
    { key: 'i', header: 'Check-in', render: (a) => formatTime(a.checkIn) },
    { key: 'o', header: 'Check-out', className: 'hide-sm', render: (a) => (a.checkOut ? formatTime(a.checkOut) : <Badge tone="info">Inside</Badge>) },
    { key: 'du', header: 'Duration', className: 'hide-md', render: (a) => { if (!a.checkOut) return '—'; const [h1, m1] = a.checkIn.split(':').map(Number); const [h2, m2] = a.checkOut.split(':').map(Number); const t = h2 * 60 + m2 - (h1 * 60 + m1); return `${Math.floor(t / 60)}h ${t % 60}m`; } },
    {
      key: 'act', header: '', className: 'col-actions',
      render: (a) => (
        <div className="row-actions">
          {!a.checkOut && <Button size="sm" variant="outline" onClick={() => { checkOut(a.id); toast.success(`${byId[a.memberId]?.name || 'Member'} checked out.`); }}>Check out</Button>}
          <IconButton icon="trash" label="Delete record" size="sm" className="danger" onClick={() => setDel(a)} />
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <PageHeader title="Attendance" subtitle={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
        <Button icon="login" onClick={() => setModal({ memberId: '' })}>Check in member</Button>
      </PageHeader>

      <div className="stats-4">
        <StatCard icon="calcheck" label="Check-ins today" value={todays.length} />
        <StatCard icon="users" tone="blue" label="Currently inside" value={inside.length} />
        <StatCard icon="checkcircle" tone="green" label="Present today" value={`${presentIds.size}`} hint={`of ${activeMembers.length} active members`} />
        <StatCard icon="alert" tone="warn" label="Absent today" value={absent} hint="Active members not yet in" />
      </div>

      <Card title="Currently in the gym" subtitle="Tap check out when a member leaves" pad={false}>
        {inside.length === 0 ? (
          <EmptyState icon="users" title="Nobody is checked in" text="Members who check in will appear here." />
        ) : (
          <ul className="list">
            {inside.map((a) => (
              <li key={a.id}>
                <Avatar name={byId[a.memberId]?.name || '?'} size={38} />
                <div className="list-main"><b>{byId[a.memberId]?.name || 'Deleted member'}</b><small>In since {formatTime(a.checkIn)}</small></div>
                <Button size="sm" variant="outline" icon="logout" onClick={() => { checkOut(a.id); toast.success(`${byId[a.memberId]?.name} checked out.`); }}>Check out</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Attendance history" pad={false}>
        <div className="toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search member…" />
          <div className="date-range">
            <Input aria-label="From date" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            <span>to</span>
            <Input aria-label="To date" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="segmented" role="group" aria-label="Quick ranges">
            <button type="button" onClick={() => { setFrom(today); setTo(today); }}>Today</button>
            <button type="button" onClick={() => { setFrom(addDays(today, -6)); setTo(today); }}>7 days</button>
            <button type="button" onClick={() => { setFrom(addDays(today, -29)); setTo(today); }}>30 days</button>
          </div>
        </div>
        <Table columns={columns} rows={history} pageSize={10} empty={<EmptyState title="No attendance records" text="Nothing found for this date range or search." />} />
      </Card>

      <Modal open={!!modal} title="Check in member" size="sm" onClose={() => setModal(null)} footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={doCheckIn}>Check in</Button></>}>
        {modal && (
          <Select label="Member" value={modal.memberId} error={modal.error} onChange={(e) => setModal({ memberId: e.target.value })}>
            <option value="">Select a member…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.status !== 'Active' ? ` (${m.status})` : ''}</option>)}
          </Select>
        )}
      </Modal>
      <ConfirmDialog open={!!del} message="Delete this attendance record? This cannot be undone." onConfirm={() => { deleteAttendance(del.id); toast.success('Record deleted.'); setDel(null); }} onCancel={() => setDel(null)} />
    </div>
  );
}
