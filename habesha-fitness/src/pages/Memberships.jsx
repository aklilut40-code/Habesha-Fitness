import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button, { IconButton } from '../components/ui/Button';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import { Input, Select, Textarea } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { validatePlan } from '../utils/validators';
import { money } from '../utils/format';

const planLabel = (name = '') => (/\bplan$/i.test(name.trim()) ? name.trim() : `${name.trim()} plan`);

const EMPTY = { name: '', price: '', durationMonths: '1', benefits: '', access: '', popular: false };

export default function Memberships() {
  const { plans, members, addPlan, updatePlan, deletePlan, assignPlan } = useData();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);
  const [assign, setAssign] = useState(null);

  const openNew = () => { setForm({ ...EMPTY }); setErrors({}); };
  const openEdit = (p) => { setForm({ ...p, price: String(p.price), durationMonths: String(p.durationMonths), benefits: p.benefits.join('\n'), access: p.access.join('\n') }); setErrors({}); };
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const subs = (id) => members.filter((m) => m.planId === id && m.status === 'Active').length;
  const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  const save = (e) => {
    e.preventDefault();
    const er = validatePlan(form);
    if (plans.some((p) => p.id !== form.id && p.name.toLowerCase() === form.name.trim().toLowerCase())) er.name = 'A plan with this name already exists';
    setErrors(er);
    if (Object.keys(er).length) return toast.error('Please fix the highlighted fields.');
    const payload = { name: form.name.trim(), price: Number(form.price), durationMonths: Number(form.durationMonths), benefits: lines(form.benefits), access: lines(form.access), popular: !!form.popular };
    if (form.id) { updatePlan(form.id, payload); toast.success(`${planLabel(payload.name)} updated.`); }
    else { addPlan(payload); toast.success(`${planLabel(payload.name)} created.`); }
    setForm(null);
  };

  const tryDelete = (p) => {
    const n = members.filter((m) => m.planId === p.id).length;
    if (n > 0) return toast.error(`${n} member${n > 1 ? 's use' : ' uses'} ${planLabel(p.name)}. Reassign them before deleting it.`);
    setDel(p);
  };

  const eligible = members.filter((m) => m.status !== 'Active' || true);
  const doAssign = () => {
    if (!assign.memberId) return setAssign({ ...assign, error: 'Select a member' });
    assignPlan(assign.memberId, assign.plan.id, assign.record, assign.method);
    toast.success(`${planLabel(assign.plan.name)} assigned to ${members.find((m) => m.id === assign.memberId)?.name}.`);
    setAssign(null);
  };

  return (
    <div className="stack">
      <PageHeader title="Membership plans" subtitle="Create and manage the plans members subscribe to">
        <Button icon="plus" onClick={openNew}>Add plan</Button>
      </PageHeader>

      {plans.length === 0 ? (
        <EmptyState icon="card" title="No plans yet" text="Create a membership plan to start enrolling members." action={<Button icon="plus" onClick={openNew}>Add plan</Button>} />
      ) : (
        <div className="grid-cards plans-admin">
          {plans.map((p) => (
            <article key={p.id} className={`plan-card ${p.popular ? 'popular' : ''}`}>
              {p.popular && <span className="plan-flag">Most popular</span>}
              <h3>{p.name}</h3>
              <div className="plan-price"><strong>{money(p.price)}</strong><span>/ {p.durationMonths === 1 ? 'month' : `${p.durationMonths} months`}</span></div>
              <p className="muted small">{subs(p.id)} active subscriber{subs(p.id) === 1 ? '' : 's'}</p>
              <h5>Benefits</h5>
              <ul>{p.benefits.map((b) => <li key={b}><Icon name="check" size={16} /> {b}</li>)}</ul>
              {p.access.length > 0 && (<><h5>Access privileges</h5><ul className="access">{p.access.map((a) => <li key={a}><Icon name="lock" size={15} /> {a}</li>)}</ul></>)}
              <div className="plan-actions">
                <Button className="grow" onClick={() => setAssign({ plan: p, memberId: '', record: true, method: 'Cash' })} icon="plus">Assign to member</Button>
                <IconButton icon="edit" label={`Edit ${p.name}`} onClick={() => openEdit(p)} />
                <IconButton icon="trash" label={`Delete ${p.name}`} className="danger" onClick={() => tryDelete(p)} />
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!form} title={form?.id ? 'Edit plan' : 'Add plan'} onClose={() => setForm(null)} size="lg" footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>{form?.id ? 'Save changes' : 'Create plan'}</Button></>}>
        {form && (
          <form onSubmit={save} noValidate className="form">
            <div className="grid-3-form">
              <Input label="Plan name" value={form.name} onChange={set('name')} error={errors.name} />
              <Input label="Price (USD)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} error={errors.price} />
              <Input label="Duration (months)" type="number" min="1" max="36" value={form.durationMonths} onChange={set('durationMonths')} error={errors.durationMonths} />
            </div>
            <Textarea label="Benefits (one per line)" rows={5} value={form.benefits} onChange={set('benefits')} error={errors.benefits} />
            <Textarea label="Access privileges (one per line)" rows={3} value={form.access} onChange={set('access')} />
            <label className="check"><input type="checkbox" checked={!!form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Highlight as “Most popular”</label>
          </form>
        )}
      </Modal>

      <Modal open={!!assign} title={`Assign ${planLabel(assign?.plan.name)}`} onClose={() => setAssign(null)} size="sm" footer={<><Button variant="ghost" onClick={() => setAssign(null)}>Cancel</Button><Button onClick={doAssign}>Assign plan</Button></>}>
        {assign && (
          <div className="form">
            <Select label="Member" value={assign.memberId} error={assign.error} onChange={(e) => setAssign({ ...assign, memberId: e.target.value, error: '' })}>
              <option value="">Select a member…</option>
              {eligible.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.status})</option>)}
            </Select>
            <label className="check"><input type="checkbox" checked={assign.record} onChange={(e) => setAssign({ ...assign, record: e.target.checked })} /> Record a simulated payment of {money(assign.plan.price)}</label>
            {assign.record && (
              <Select label="Payment method" value={assign.method} onChange={(e) => setAssign({ ...assign, method: e.target.value })}>
                {['Cash', 'Card', 'Mobile Money', 'Bank Transfer'].map((m) => <option key={m}>{m}</option>)}
              </Select>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} message={`Delete ${planLabel(del?.name)}? This cannot be undone.`} confirmLabel="Delete plan" onConfirm={() => { deletePlan(del.id); toast.success(`${planLabel(del.name)} deleted.`); setDel(null); }} onCancel={() => setDel(null)} />
    </div>
  );
}
