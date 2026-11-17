import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button, { IconButton } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Table from '../components/ui/Table';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import { Input, Select, SearchBox, Textarea } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { useQueryAction, useRoute } from '../store/router';
import { PROGRAMS } from '../store/programs';
import { validateMember } from '../utils/validators';
import { addMonths, daysBetween, downloadCSV, formatDate, formatTime, money, todayISO } from '../utils/format';

const EMPTY = { name: '', email: '', phone: '', gender: '', planId: '', trainerId: '', programId: '', status: 'Pending', joinDate: todayISO(), expiryDate: '', notes: '' };

export default function Members() {
  const { members, plans, trainers, payments, attendance, addMember, updateMember, deleteMember, assignPlan } = useData();
  const toast = useToast();
  const { query } = useRoute();
  const [q, setQ] = useState(query.q || '');
  const [status, setStatus] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [form, setForm] = useState(null); // member form modal
  const [errors, setErrors] = useState({});
  const [view, setView] = useState(null); // member id
  const [del, setDel] = useState(null);
  const [assign, setAssign] = useState(null); // { memberId, planId, method, record }

  useEffect(() => { if (query.q !== undefined) setQ(query.q); }, [query.q]);
  useQueryAction('new', () => openNew());

  const planName = (id) => plans.find((p) => p.id === id)?.name;
  const trainerName = (id) => trainers.find((t) => t.id === id)?.name;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) => {
      if (status !== 'All' && m.status !== status) return false;
      if (planFilter !== 'All' && (planFilter === 'none' ? m.planId : m.planId !== planFilter)) return false;
      if (!needle) return true;
      return [m.name, m.email, m.phone].some((v) => v.toLowerCase().includes(needle));
    });
  }, [members, q, status, planFilter]);

  const counts = useMemo(() => ({
    All: members.length,
    Active: members.filter((m) => m.status === 'Active').length,
    Pending: members.filter((m) => m.status === 'Pending').length,
    Expired: members.filter((m) => m.status === 'Expired').length,
  }), [members]);

  const openNew = () => { setForm({ ...EMPTY, joinDate: todayISO() }); setErrors({}); };
  const openEdit = (m) => { setForm({ ...EMPTY, ...m, planId: m.planId || '', trainerId: m.trainerId || '', programId: m.programId || '', expiryDate: m.expiryDate || '' }); setErrors({}); };
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  const save = (e) => {
    e.preventDefault();
    const er = validateMember(form);
    if (members.some((m) => m.id !== form.id && m.email.toLowerCase() === form.email.trim().toLowerCase())) er.email = 'Another member already uses this email';
    if (form.status === 'Active' && !form.planId) er.planId = 'Active members need a plan';
    if (form.expiryDate && form.expiryDate < form.joinDate) er.expiryDate = 'Expiry must be after the join date';
    setErrors(er);
    if (Object.keys(er).length) return toast.error('Please fix the highlighted fields.');
    const plan = plans.find((p) => p.id === form.planId);
    const payload = {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), gender: form.gender,
      planId: form.planId || null, trainerId: form.trainerId || null, programId: form.programId || null,
      status: form.status, joinDate: form.joinDate,
      expiryDate: form.expiryDate || (plan && form.status === 'Active' ? addMonths(form.joinDate, plan.durationMonths) : null),
      notes: form.notes.trim(),
    };
    if (form.id) { updateMember(form.id, payload); toast.success(`${payload.name} updated.`); }
    else { addMember(payload); toast.success(`${payload.name} added.`); }
    setForm(null);
  };

  const confirmDelete = () => {
    deleteMember(del.id);
    toast.success(`${del.name} deleted.`);
    if (view === del.id) setView(null);
    setDel(null);
  };

  const exportCSV = () => {
    downloadCSV('members.csv', [
      ['Name', 'Email', 'Phone', 'Gender', 'Plan', 'Status', 'Joined', 'Expires'],
      ...rows.map((m) => [m.name, m.email, m.phone, m.gender, planName(m.planId) || '', m.status, m.joinDate, m.expiryDate || '']),
    ]);
    toast.success(`Exported ${rows.length} members.`);
  };

  const submitAssign = () => {
    assignPlan(assign.memberId, assign.planId, assign.record, assign.method);
    const m = members.find((x) => x.id === assign.memberId);
    toast.success(`${planName(assign.planId)} plan assigned to ${m?.name}.${assign.record ? ' Payment recorded (simulated).' : ''}`);
    setAssign(null);
  };

  const viewing = members.find((m) => m.id === view);
  const columns = [
    { key: 'name', header: 'Member', render: (m) => (<div className="cell-user"><Avatar name={m.name} size={36} /><div><b>{m.name}</b><small>{m.email}</small></div></div>) },
    { key: 'phone', header: 'Phone', className: 'hide-md', render: (m) => m.phone },
    { key: 'plan', header: 'Plan', className: 'hide-sm', render: (m) => planName(m.planId) || <span className="muted">—</span> },
    { key: 'status', header: 'Status', render: (m) => <Badge>{m.status}</Badge> },
    { key: 'expiry', header: 'Expires', className: 'hide-md', render: (m) => formatDate(m.expiryDate) },
    {
      key: 'actions', header: '', className: 'col-actions',
      render: (m) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <IconButton icon="eye" label={`View ${m.name}`} size="sm" onClick={() => setView(m.id)} />
          <IconButton icon="edit" label={`Edit ${m.name}`} size="sm" onClick={() => openEdit(m)} />
          <IconButton icon="trash" label={`Delete ${m.name}`} size="sm" className="danger" onClick={() => setDel(m)} />
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <PageHeader title="Members" subtitle={`${members.length} total members`}>
        <Button variant="outline" icon="download" onClick={exportCSV} disabled={!rows.length}>Export CSV</Button>
        <Button icon="plus" onClick={openNew}>Add member</Button>
      </PageHeader>

      <Card pad={false}>
        <div className="toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search by name, email or phone…" />
          <div className="segmented scroll-x" role="group" aria-label="Filter by status">
            {['All', 'Active', 'Pending', 'Expired'].map((s) => (
              <button key={s} type="button" className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{s} <em>{counts[s]}</em></button>
            ))}
          </div>
          <Select aria-label="Filter by plan" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="All">All plans</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="none">No plan</option>
          </Select>
        </div>
        <Table
          columns={columns}
          rows={rows}
          onRowClick={(m) => setView(m.id)}
          empty={
            <EmptyState
              title={members.length ? 'No members match your filters' : 'No members yet'}
              text={members.length ? 'Try a different search term or clear the filters.' : 'Add your first member to get started.'}
              action={members.length ? <Button variant="outline" onClick={() => { setQ(''); setStatus('All'); setPlanFilter('All'); }}>Clear filters</Button> : <Button icon="plus" onClick={openNew}>Add member</Button>}
            />
          }
        />
      </Card>

      {/* Add / edit */}
      <Modal
        open={!!form}
        title={form?.id ? 'Edit member' : 'Add new member'}
        onClose={() => setForm(null)}
        size="lg"
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>{form?.id ? 'Save changes' : 'Add member'}</Button></>}
      >
        {form && (
          <form onSubmit={save} noValidate className="form">
            <div className="grid-2">
              <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} />
              <Select label="Gender" value={form.gender} onChange={set('gender')} error={errors.gender}>
                <option value="">Select…</option><option>Female</option><option>Male</option><option>Other</option>
              </Select>
              <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
              <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
              <Select label="Membership plan" value={form.planId} onChange={set('planId')} error={errors.planId}>
                <option value="">No plan</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}
              </Select>
              <Select label="Status" value={form.status} onChange={set('status')}>
                <option>Active</option><option>Pending</option><option>Expired</option>
              </Select>
              <Input label="Join date" type="date" value={form.joinDate} onChange={set('joinDate')} />
              <Input label="Expiry date" type="date" value={form.expiryDate} onChange={set('expiryDate')} error={errors.expiryDate} hint="Leave blank to calculate from the plan" />
              <Select label="Assigned trainer" value={form.trainerId} onChange={set('trainerId')}>
                <option value="">None</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
              <Select label="Workout program" value={form.programId} onChange={set('programId')}>
                <option value="">None</option>
                {PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <Textarea label="Notes" rows={3} value={form.notes} onChange={set('notes')} placeholder="Goals, injuries, preferences…" />
          </form>
        )}
      </Modal>

      {/* Details */}
      <Modal
        open={!!viewing}
        title="Member profile"
        onClose={() => setView(null)}
        size="lg"
        footer={viewing && (
          <>
            <Button variant="danger-ghost" icon="trash" onClick={() => setDel(viewing)}>Delete</Button>
            <Button variant="outline" icon="edit" onClick={() => { openEdit(viewing); setView(null); }}>Edit</Button>
            <Button icon="card" onClick={() => setAssign({ memberId: viewing.id, planId: viewing.planId || plans[0]?.id || '', method: 'Cash', record: true })} disabled={!plans.length}>
              {viewing.planId ? 'Renew / change plan' : 'Assign plan'}
            </Button>
          </>
        )}
      >
        {viewing && <MemberDetail m={viewing} plan={planName(viewing.planId)} trainer={trainerName(viewing.trainerId)} payments={payments.filter((p) => p.memberId === viewing.id).slice(0, 4)} visits={attendance.filter((a) => a.memberId === viewing.id)} />}
      </Modal>

      {/* Assign plan */}
      <Modal
        open={!!assign}
        title="Assign membership"
        onClose={() => setAssign(null)}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setAssign(null)}>Cancel</Button><Button onClick={submitAssign}>Confirm</Button></>}
      >
        {assign && (
          <div className="form">
            <Select label="Plan" value={assign.planId} onChange={(e) => setAssign({ ...assign, planId: e.target.value })}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)} / {p.durationMonths} mo</option>)}
            </Select>
            <label className="check"><input type="checkbox" checked={assign.record} onChange={(e) => setAssign({ ...assign, record: e.target.checked })} /> Record a simulated payment</label>
            {assign.record && (
              <Select label="Payment method" value={assign.method} onChange={(e) => setAssign({ ...assign, method: e.target.value })}>
                {['Cash', 'Card', 'Mobile Money', 'Bank Transfer'].map((m) => <option key={m}>{m}</option>)}
              </Select>
            )}
            <p className="muted small">The membership becomes Active and the expiry date is extended by the plan duration.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} message={`Delete ${del?.name}? Their attendance history will be removed too. This cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </div>
  );
}

function MemberDetail({ m, plan, trainer, payments, visits }) {
  const today = todayISO();
  const left = m.expiryDate ? daysBetween(today, m.expiryDate) : null;
  const program = PROGRAMS.find((p) => p.id === m.programId)?.name;
  return (
    <div className="detail">
      <div className="detail-head">
        <Avatar name={m.name} size={64} />
        <div>
          <h3>{m.name}</h3>
          <div className="detail-badges"><Badge>{m.status}</Badge>{plan && <Badge tone="neutral" dot={false}>{plan} plan</Badge>}</div>
        </div>
      </div>
      <dl className="dl">
        <div><dt><Icon name="mail" size={15} /> Email</dt><dd>{m.email}</dd></div>
        <div><dt><Icon name="phone" size={15} /> Phone</dt><dd>{m.phone}</dd></div>
        <div><dt><Icon name="user" size={15} /> Gender</dt><dd>{m.gender}</dd></div>
        <div><dt><Icon name="calendar" size={15} /> Joined</dt><dd>{formatDate(m.joinDate)}</dd></div>
        <div><dt><Icon name="clock" size={15} /> Expires</dt><dd>{formatDate(m.expiryDate)}{left !== null && <small className={left < 0 ? 'text-danger' : left <= 7 ? 'text-warn' : 'muted'}> · {left < 0 ? `${-left} days ago` : `in ${left} days`}</small>}</dd></div>
        <div><dt><Icon name="dumbbell" size={15} /> Trainer</dt><dd>{trainer || '—'}</dd></div>
        <div><dt><Icon name="flame" size={15} /> Program</dt><dd>{program || '—'}</dd></div>
        <div><dt><Icon name="calcheck" size={15} /> Visits (30 days)</dt><dd>{visits.length}</dd></div>
      </dl>
      {m.notes && <p className="note-box">{m.notes}</p>}
      <h4 className="detail-sub">Recent payments</h4>
      {payments.length === 0 ? <p className="muted small">No payments recorded.</p> : (
        <ul className="mini-list">
          {payments.map((p) => (<li key={p.id}><span>{formatDate(p.date)} · {p.method}</span><b>{money(p.amount)}</b><Badge>{p.status}</Badge></li>))}
        </ul>
      )}
      <h4 className="detail-sub">Latest visits</h4>
      {visits.length === 0 ? <p className="muted small">No visits yet.</p> : (
        <ul className="mini-list">
          {visits.slice(0, 3).map((a) => (<li key={a.id}><span>{formatDate(a.date)}</span><b>{formatTime(a.checkIn)} – {a.checkOut ? formatTime(a.checkOut) : 'inside'}</b></li>))}
        </ul>
      )}
    </div>
  );
}
