import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button, { IconButton } from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import { Input, Select, SearchBox, Textarea } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { useQueryAction } from '../store/router';
import { IMAGES } from '../store/images';
import { validateTrainer } from '../utils/validators';

const EMPTY = { name: '', specialization: '', experience: '', email: '', phone: '', availability: '', bio: '', photo: '' };

export default function Trainers() {
  const { trainers, members, addTrainer, updateTrainer, deleteTrainer } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [view, setView] = useState(null);
  const [del, setDel] = useState(null);

  useQueryAction('new', () => openNew());
  const openNew = () => { setForm({ ...EMPTY }); setErrors({}); };
  const openEdit = (t) => { setForm({ ...EMPTY, ...t, photo: t.photo || '', experience: String(t.experience) }); setErrors({}); };
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return trainers.filter((t) => !n || [t.name, t.specialization].some((v) => v.toLowerCase().includes(n)));
  }, [trainers, q]);

  const clients = (id) => members.filter((m) => m.trainerId === id).length;

  const save = (e) => {
    e.preventDefault();
    const er = validateTrainer(form);
    setErrors(er);
    if (Object.keys(er).length) return toast.error('Please fix the highlighted fields.');
    const payload = { ...form, name: form.name.trim(), specialization: form.specialization.trim(), experience: Number(form.experience), email: form.email.trim(), phone: form.phone.trim(), availability: form.availability.trim(), photo: form.photo || null };
    if (form.id) { updateTrainer(form.id, payload); toast.success(`${payload.name} updated.`); }
    else { addTrainer(payload); toast.success(`${payload.name} added to the team.`); }
    setForm(null);
  };

  const viewing = trainers.find((t) => t.id === view);

  return (
    <div className="stack">
      <PageHeader title="Trainers" subtitle={`${trainers.length} coaches on the team`}>
        <Button icon="plus" onClick={openNew}>Add trainer</Button>
      </PageHeader>
      <div className="toolbar toolbar-plain"><SearchBox value={q} onChange={setQ} placeholder="Search trainers or specialization…" /></div>

      {rows.length === 0 ? (
        <EmptyState icon="dumbbell" title={trainers.length ? 'No trainers match your search' : 'No trainers yet'} text={trainers.length ? 'Try a different keyword.' : 'Add your first coach to get started.'} action={!trainers.length && <Button icon="plus" onClick={openNew}>Add trainer</Button>} />
      ) : (
        <div className="grid-cards">
          {rows.map((t) => (
            <article key={t.id} className="trainer-card">
              <div className="trainer-photo">
                {t.photo ? <img src={IMAGES[t.photo]} alt={t.name} style={{ objectPosition: '50% 22%' }} /> : <div className="trainer-ph"><Avatar name={t.name} size={84} /></div>}
              </div>
              <div className="trainer-body">
                <h3>{t.name}</h3>
                <span className="accent-text">{t.specialization}</span>
                <ul className="meta-list">
                  <li><Icon name="trending" size={15} /> {t.experience} yrs experience</li>
                  <li><Icon name="clock" size={15} /> {t.availability}</li>
                  <li><Icon name="users" size={15} /> {clients(t.id)} assigned members</li>
                </ul>
                <div className="card-actions">
                  <Button size="sm" variant="outline" icon="eye" onClick={() => setView(t.id)}>View</Button>
                  <IconButton icon="edit" label={`Edit ${t.name}`} onClick={() => openEdit(t)} />
                  <IconButton icon="trash" label={`Delete ${t.name}`} className="danger" onClick={() => setDel(t)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!form} title={form?.id ? 'Edit trainer' : 'Add trainer'} onClose={() => setForm(null)} size="lg" footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>{form?.id ? 'Save changes' : 'Add trainer'}</Button></>}>
        {form && (
          <form onSubmit={save} noValidate className="form">
            <div className="grid-2">
              <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} />
              <Input label="Specialization" value={form.specialization} onChange={set('specialization')} error={errors.specialization} placeholder="e.g. Strength & Conditioning" />
              <Input label="Experience (years)" type="number" min="0" max="60" value={form.experience} onChange={set('experience')} error={errors.experience} />
              <Input label="Availability" value={form.availability} onChange={set('availability')} error={errors.availability} placeholder="Mon–Fri, 8:00–16:00" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
              <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
            </div>
            <Select label="Profile photo" value={form.photo} onChange={set('photo')} hint="Choose one of the uploaded gym photos, or use initials">
              <option value="">Initials avatar</option>
              <option value="hero">Photo 1 — bodybuilder portrait</option>
              <option value="fitness">Photo 2 — female athlete</option>
              <option value="training">Photo 3 — personal trainer</option>
              <option value="workout">Photo 4 — deadlift</option>
            </Select>
            <Textarea label="Short bio" rows={3} value={form.bio} onChange={set('bio')} />
          </form>
        )}
      </Modal>

      <Modal open={!!viewing} title="Trainer profile" onClose={() => setView(null)} footer={viewing && <><Button variant="outline" icon="edit" onClick={() => { openEdit(viewing); setView(null); }}>Edit</Button><Button variant="ghost" onClick={() => setView(null)}>Close</Button></>}>
        {viewing && (
          <div className="detail">
            <div className="detail-head"><Avatar name={viewing.name} photo={viewing.photo} size={72} /><div><h3>{viewing.name}</h3><span className="accent-text">{viewing.specialization}</span></div></div>
            {viewing.bio && <p className="note-box">{viewing.bio}</p>}
            <dl className="dl">
              <div><dt><Icon name="trending" size={15} /> Experience</dt><dd>{viewing.experience} years</dd></div>
              <div><dt><Icon name="clock" size={15} /> Availability</dt><dd>{viewing.availability}</dd></div>
              <div><dt><Icon name="mail" size={15} /> Email</dt><dd><a href={`mailto:${viewing.email}`}>{viewing.email}</a></dd></div>
              <div><dt><Icon name="phone" size={15} /> Phone</dt><dd><a href={`tel:${viewing.phone.replace(/\s/g, '')}`}>{viewing.phone}</a></dd></div>
              <div><dt><Icon name="users" size={15} /> Assigned members</dt><dd>{clients(viewing.id)}</dd></div>
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} message={`Remove ${del?.name} from the team? Members assigned to this trainer will be left without a trainer.`} confirmLabel="Remove trainer" onConfirm={() => { deleteTrainer(del.id); toast.success(`${del.name} removed.`); setDel(null); }} onCancel={() => setDel(null)} />
    </div>
  );
}
