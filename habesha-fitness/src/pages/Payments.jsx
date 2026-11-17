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
import { Input, Select, SearchBox, Textarea } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { useQueryAction } from '../store/router';
import { validatePayment } from '../utils/validators';
import { downloadCSV, formatDate, money, todayISO } from '../utils/format';

const METHODS = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer'];
const EMPTY = { memberId: '', planId: '', amount: '', date: todayISO(), method: 'Cash', status: 'Paid', note: '' };

export default function Payments() {
  const { payments, members, plans, addPayment, updatePayment, deletePayment } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [method, setMethod] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);

  useQueryAction('new', () => openNew());
  const openNew = () => { setForm({ ...EMPTY, date: todayISO() }); setErrors({}); };
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const nameOf = (p) => members.find((m) => m.id === p.memberId)?.name || p.memberName || 'Deleted member';

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return payments.filter((p) => {
      if (status !== 'All' && p.status !== status) return false;
      if (method !== 'All' && p.method !== method) return false;
      if (from && p.date < from) return false;
      if (to && p.date > to) return false;
      return !n || nameOf(p).toLowerCase().includes(n) || p.id.toLowerCase().includes(n);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, members, q, status, method, from, to]);

  const sum = useMemo(() => {
    const t = (st) => rows.filter((p) => p.status === st).reduce((a, p) => a + p.amount, 0);
    return { paid: t('Paid'), pending: t('Pending'), failed: t('Failed'), n: rows.length };
  }, [rows]);

  const pickMember = (e) => {
    const m = members.find((x) => x.id === e.target.value);
    const plan = plans.find((p) => p.id === m?.planId);
    setForm({ ...form, memberId: e.target.value, planId: plan?.id || '', amount: plan ? String(plan.price) : form.amount });
  };

  const save = (e) => {
    e.preventDefault();
    const er = validatePayment(form);
    setErrors(er);
    if (Object.keys(er).length) return toast.error('Please fix the highlighted fields.');
    addPayment({ memberId: form.memberId, planId: form.planId || null, amount: Number(form.amount), date: form.date, method: form.method, status: form.status, note: form.note.trim() });
    toast.success(`Payment of ${money(Number(form.amount), 2)} recorded (simulated).`);
    setForm(null);
  };

  const exportCSV = () => {
    downloadCSV('payments.csv', [['ID', 'Member', 'Amount', 'Date', 'Method', 'Status', 'Note'], ...rows.map((p) => [p.id, nameOf(p), p.amount, p.date, p.method, p.status, p.note || ''])]);
    toast.success(`Exported ${rows.length} payments.`);
  };

  const columns = [
    { key: 'm', header: 'Member', render: (p) => <div className="cell-user"><Avatar name={nameOf(p)} size={32} /><div><b>{nameOf(p)}</b><small>{p.id}</small></div></div> },
    { key: 'a', header: 'Amount', render: (p) => <b>{money(p.amount, 2)}</b> },
    { key: 'd', header: 'Date', className: 'hide-sm', render: (p) => formatDate(p.date) },
    { key: 'me', header: 'Method', className: 'hide-md', render: (p) => p.method },
    { key: 's', header: 'Status', render: (p) => <Badge>{p.status}</Badge> },
    {
      key: 'act', header: '', className: 'col-actions',
      render: (p) => (
        <div className="row-actions">
          {p.status !== 'Paid' && <Button size="sm" variant="outline" icon="check" onClick={() => { updatePayment(p.id, { status: 'Paid' }); toast.success('Payment marked as paid.'); }}>Mark paid</Button>}
          <IconButton icon="trash" label="Delete payment" size="sm" className="danger" onClick={() => setDel(p)} />
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <PageHeader title="Payments" subtitle="Simulated payments — no real transactions are processed">
        <Button variant="outline" icon="download" onClick={exportCSV} disabled={!rows.length}>Export CSV</Button>
        <Button icon="plus" onClick={openNew}>Add payment</Button>
      </PageHeader>

      <div className="stats-4">
        <StatCard icon="checkcircle" tone="green" label="Collected" value={money(sum.paid)} hint="Paid, in current view" />
        <StatCard icon="clock" tone="warn" label="Pending" value={money(sum.pending)} />
        <StatCard icon="alert" tone="red" label="Failed" value={money(sum.failed)} />
        <StatCard icon="wallet" label="Transactions" value={sum.n} hint="Matching filters" />
      </div>

      <Card pad={false}>
        <div className="toolbar toolbar-wrap">
          <SearchBox value={q} onChange={setQ} placeholder="Search by member or ID…" />
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="All">All statuses</option><option>Paid</option><option>Pending</option><option>Failed</option></Select>
          <Select aria-label="Method" value={method} onChange={(e) => setMethod(e.target.value)}><option value="All">All methods</option>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
          <div className="date-range">
            <Input aria-label="From date" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            <span>to</span>
            <Input aria-label="To date" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(q || status !== 'All' || method !== 'All' || from || to) && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setStatus('All'); setMethod('All'); setFrom(''); setTo(''); }}>Clear</Button>}
        </div>
        <Table columns={columns} rows={rows} pageSize={10} empty={<EmptyState icon="wallet" title="No payments found" text="Adjust the filters or record a new payment." action={<Button icon="plus" onClick={openNew}>Add payment</Button>} />} />
      </Card>

      <Modal open={!!form} title="Add payment" size="md" onClose={() => setForm(null)} footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Record payment</Button></>}>
        {form && (
          <form onSubmit={save} noValidate className="form">
            <div className="sim-note">Simulation only — this just saves a record in your browser.</div>
            <Select label="Member" value={form.memberId} onChange={pickMember} error={errors.memberId}>
              <option value="">Select a member…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
            <div className="grid-2">
              <Input label="Amount (USD)" type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} error={errors.amount} />
              <Input label="Date" type="date" value={form.date} onChange={set('date')} error={errors.date} />
              <Select label="Method" value={form.method} onChange={set('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
              <Select label="Status" value={form.status} onChange={set('status')}><option>Paid</option><option>Pending</option><option>Failed</option></Select>
            </div>
            <Textarea label="Note (optional)" rows={2} value={form.note} onChange={set('note')} />
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!del} message={`Delete payment ${del?.id} (${del ? money(del.amount, 2) : ''})? This cannot be undone.`} onConfirm={() => { deletePayment(del.id); toast.success('Payment deleted.'); setDel(null); }} onCancel={() => setDel(null)} />
    </div>
  );
}
