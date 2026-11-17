import Icon from '../ui/Icon';
import Logo from './Logo';
import { Link } from '../../store/router';
import { useData } from '../../store/DataContext';

export const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/app/members', label: 'Members', icon: 'users' },
  { to: '/app/trainers', label: 'Trainers', icon: 'dumbbell' },
  { to: '/app/memberships', label: 'Memberships', icon: 'card' },
  { to: '/app/programs', label: 'Workout Programs', icon: 'flame' },
  { to: '/app/attendance', label: 'Attendance', icon: 'calcheck' },
  { to: '/app/payments', label: 'Payments', icon: 'wallet' },
  { to: '/app/reports', label: 'Reports', icon: 'chart' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar({ path, open, onClose, onLogout }) {
  const { settings } = useData();
  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-top">
          <Link to="/" className="sidebar-brand" onClick={onClose}>
            <Logo name={settings.gymName} />
          </Link>
          <button type="button" className="icon-btn icon-btn-ghost sidebar-close" onClick={onClose} aria-label="Close menu"><Icon name="x" /></button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={onClose} className={`nav-item ${path === n.to ? 'active' : ''}`} aria-current={path === n.to ? 'page' : undefined}>
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button type="button" className="nav-item nav-logout" onClick={onLogout}>
            <Icon name="logout" size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
