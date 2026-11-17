import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { Link, navigate } from '../../store/router';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { daysBetween, todayISO, formatDate } from '../../utils/format';

function useOutside(ref, fn) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && fn();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, fn]);
}

export default function Topbar({ title, onMenu, onLogout }) {
  const { members, payments } = useData();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(null); // 'bell' | 'user' | null
  const bellRef = useRef(null);
  const userRef = useRef(null);
  useOutside(bellRef, () => setMenu((m) => (m === 'bell' ? null : m)));
  useOutside(userRef, () => setMenu((m) => (m === 'user' ? null : m)));

  const alerts = useMemo(() => {
    const today = todayISO();
    const list = [];
    members
      .filter((m) => m.status === 'Active' && m.expiryDate && daysBetween(today, m.expiryDate) <= 7)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .slice(0, 4)
      .forEach((m) => list.push({ id: `e${m.id}`, icon: 'clock', text: `${m.name}'s membership expires ${formatDate(m.expiryDate, { day: 'numeric', month: 'short' })}`, to: '/app/members' }));
    const pend = payments.filter((p) => p.status === 'Pending').length;
    if (pend) list.push({ id: 'pp', icon: 'wallet', text: `${pend} payment${pend > 1 ? 's' : ''} awaiting confirmation`, to: '/app/payments' });
    const pm = members.filter((m) => m.status === 'Pending').length;
    if (pm) list.push({ id: 'pm', icon: 'users', text: `${pm} new registration${pm > 1 ? 's' : ''} need a plan`, to: '/app/members' });
    return list;
  }, [members, payments]);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/app/members${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    setQ('');
  };

  return (
    <header className="topbar">
      <button type="button" className="icon-btn icon-btn-ghost menu-btn" onClick={onMenu} aria-label="Open menu"><Icon name="menu" size={21} /></button>
      <h2 className="topbar-title">{title}</h2>
      <form className="topbar-search" onSubmit={submit} role="search">
        <Icon name="search" size={17} className="input-icon" />
        <input className="input with-icon" placeholder="Search members…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
      </form>
      <div className="topbar-right">
        <div className="menu-wrap" ref={bellRef}>
          <button type="button" className="icon-btn icon-btn-ghost bell" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label="Notifications">
            <Icon name="bell" size={19} />
            {alerts.length > 0 && <span className="bell-dot">{alerts.length}</span>}
          </button>
          {menu === 'bell' && (
            <div className="dropdown dropdown-wide">
              <div className="dropdown-head">Notifications</div>
              {alerts.length === 0 && <p className="dropdown-empty">You're all caught up.</p>}
              {alerts.map((a) => (
                <Link key={a.id} to={a.to} className="dropdown-item" onClick={() => setMenu(null)}>
                  <Icon name={a.icon} size={16} />
                  <span>{a.text}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="menu-wrap" ref={userRef}>
          <button type="button" className="user-chip" onClick={() => setMenu(menu === 'user' ? null : 'user')} aria-label="Account menu">
            <Avatar name={user?.name} size={34} />
            <span className="user-chip-text"><b>{user?.name}</b><small>{user?.role}</small></span>
            <Icon name="down" size={15} />
          </button>
          {menu === 'user' && (
            <div className="dropdown">
              <Link to="/app/settings" className="dropdown-item" onClick={() => setMenu(null)}><Icon name="user" size={16} /><span>Profile & settings</span></Link>
              <Link to="/" className="dropdown-item" onClick={() => setMenu(null)}><Icon name="arrow" size={16} /><span>View public site</span></Link>
              <button type="button" className="dropdown-item" onClick={onLogout}><Icon name="logout" size={16} /><span>Logout</span></button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
