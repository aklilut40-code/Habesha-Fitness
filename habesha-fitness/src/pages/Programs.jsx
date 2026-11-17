import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Icon from '../components/ui/Icon';
import { Select } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { IMAGES } from '../store/images';
import { PROGRAMS } from '../store/programs';

export default function Programs() {
  const { members, updateMember } = useData();
  const toast = useToast();
  const [level, setLevel] = useState('All');
  const [detail, setDetail] = useState(null);
  const [enroll, setEnroll] = useState(null); // { program, memberId, error }

  const list = useMemo(() => PROGRAMS.filter((p) => level === 'All' || p.level === level), [level]);
  const enrolled = (id) => members.filter((m) => m.programId === id).length;
  const sel = PROGRAMS.find((p) => p.id === detail);

  const doEnroll = () => {
    if (!enroll.memberId) return setEnroll({ ...enroll, error: 'Select a member' });
    const m = members.find((x) => x.id === enroll.memberId);
    updateMember(m.id, { programId: enroll.program.id });
    toast.success(`${m.name} enrolled in ${enroll.program.name}.`);
    setEnroll(null);
  };

  return (
    <div className="stack">
      <PageHeader title="Workout programs" subtitle="Structured training plans members can follow">
        <div className="segmented scroll-x" role="group" aria-label="Filter by level">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((l) => (<button key={l} type="button" className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>{l}</button>))}
        </div>
      </PageHeader>

      <div className="grid-cards">
        {list.map((p) => (
          <article key={p.id} className="program-card">
            <div className="program-img">
              <img src={IMAGES[p.image]} alt={p.name} style={{ objectPosition: p.pos }} />
              <span className="program-level"><Badge>{p.level}</Badge></span>
            </div>
            <div className="program-body">
              <div className="program-meta"><span><Icon name="clock" size={14} /> {p.weeks} weeks</span><span><Icon name="calendar" size={14} /> {p.sessionsPerWeek}×/week</span><span><Icon name="users" size={14} /> {enrolled(p.id)} enrolled</span></div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="card-actions">
                <Button size="sm" variant="outline" icon="eye" onClick={() => setDetail(p.id)}>Details</Button>
                <Button size="sm" icon="plus" onClick={() => setEnroll({ program: p, memberId: '' })}>Enroll member</Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={!!sel} title={sel?.name} onClose={() => setDetail(null)} size="lg" footer={sel && <><Button variant="ghost" onClick={() => setDetail(null)}>Close</Button><Button icon="plus" onClick={() => { setEnroll({ program: sel, memberId: '' }); setDetail(null); }}>Enroll member</Button></>}>
        {sel && (
          <div className="detail">
            <div className="program-hero"><img src={IMAGES[sel.image]} alt={sel.name} style={{ objectPosition: sel.pos }} /></div>
            <div className="detail-badges"><Badge>{sel.level}</Badge><Badge tone="neutral" dot={false}>{sel.weeks} weeks</Badge><Badge tone="neutral" dot={false}>{sel.sessionsPerWeek} sessions / week</Badge></div>
            <p>{sel.description}</p>
            <div className="grid-2">
              <div><h4 className="detail-sub">Weekly schedule</h4><ul className="mini-list">{sel.schedule.map(([d, w]) => (<li key={d}><b>{d}</b><span>{w}</span></li>))}</ul></div>
              <div><h4 className="detail-sub">Key exercises</h4><ul className="check-list">{sel.exercises.map((x) => (<li key={x}><Icon name="check" size={15} /> {x}</li>))}</ul></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!enroll} title={`Enroll in ${enroll?.program.name}`} onClose={() => setEnroll(null)} size="sm" footer={<><Button variant="ghost" onClick={() => setEnroll(null)}>Cancel</Button><Button onClick={doEnroll}>Enroll</Button></>}>
        {enroll && (
          <Select label="Member" value={enroll.memberId} error={enroll.error} onChange={(e) => setEnroll({ ...enroll, memberId: e.target.value, error: '' })}>
            <option value="">Select a member…</option>
            {members.filter((m) => m.status !== 'Expired').map((m) => (<option key={m.id} value={m.id}>{m.name}{m.programId === enroll.program.id ? ' (already enrolled)' : ''}</option>))}
          </Select>
        )}
      </Modal>
    </div>
  );
}
