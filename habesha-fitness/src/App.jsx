import { useEffect } from 'react';
import { LangProvider } from './i18n/LangContext';
import ChatBot from './components/chat/ChatBot';
import { DataProvider } from './store/DataContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { navigate, useRoute } from './store/router';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Trainers from './pages/Trainers';
import Memberships from './pages/Memberships';
import Programs from './pages/Programs';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const APP_PAGES = {
  '/app/dashboard': Dashboard,
  '/app/members': Members,
  '/app/trainers': Trainers,
  '/app/memberships': Memberships,
  '/app/programs': Programs,
  '/app/attendance': Attendance,
  '/app/payments': Payments,
  '/app/reports': Reports,
  '/app/settings': Settings,
};

function Router() {
  const { path } = useRoute();
  const { user } = useAuth();
  const isApp = path.startsWith('/app');

  useEffect(() => {
    if (isApp && !user) navigate('/login', true);
    if (path === '/app') navigate('/app/dashboard', true);
    if ((path === '/login' || path === '/register') && user) navigate('/app/dashboard', true);
    if (!isApp) window.scrollTo(0, 0);
  }, [path, user, isApp]);

  if (path === '/') return <Landing />;
  if (path === '/login') return user ? null : <Login />;
  if (path === '/register') return user ? null : <Register />;
  if (isApp) {
    if (!user) return null;
    const Page = APP_PAGES[path];
    if (!Page) return path === '/app' ? null : <AppLayout path={path}><NotFound /></AppLayout>;
    return (
      <AppLayout path={path}>
        <Page />
      </AppLayout>
    );
  }
  return <NotFound standalone />;
}

// The chat assistant is for visitors, so it only appears on the public pages (landing, login, register).
function ChatGate() {
  const { path } = useRoute();
  return path.startsWith('/app') ? null : <ChatBot />;
}

export default function App() {
  return (
    <LangProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Router />
            <ChatGate />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </LangProvider>
  );
}
kkkkkk