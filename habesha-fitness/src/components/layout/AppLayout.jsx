import { useEffect, useState } from 'react';
import Sidebar, { NAV } from './Sidebar';
import Topbar from './Topbar';
import { navigate } from '../../store/router';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../ui/Toast';

export default function AppLayout({ path, children }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const toast = useToast();
  const title = NAV.find((n) => n.to === path)?.label || 'Dashboard';

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [path]);

  const doLogout = () => {
    logout();
    toast.info('You have been logged out.');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Sidebar path={path} open={open} onClose={() => setOpen(false)} onLogout={doLogout} />
      <div className="app-main">
        <Topbar title={title} onMenu={() => setOpen(true)} onLogout={doLogout} />
        <main className="app-content">{children}</main>
        <footer className="app-foot">Demo data stored in your browser only · Payments are simulated</footer>
      </div>
    </div>
  );
}
