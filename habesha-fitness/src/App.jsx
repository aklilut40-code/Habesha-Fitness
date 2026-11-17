// The App component is the root component of the application. It wraps the entire application in various context providers, including LangProvider for language support, ToastProvider for displaying toast notifications, AuthProvider for managing user authentication, and DataProvider for managing application data. It also renders the Router component, which handles routing and page rendering based on the current path and user authentication status, and the ChatGate component, which conditionally renders a chat assistant on public pages.
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
// The APP_PAGES object maps the route paths to their corresponding page components. This allows the Router component to dynamically render the appropriate page based on the current path.
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
// The Router component is responsible for rendering the appropriate page based on the current route and user authentication status. It uses the useRoute hook to get the current path and the useAuth hook to get the user authentication status. It also uses the useEffect hook to perform side effects when the path or user changes, such as navigating to different pages or scrolling to the top of the page.
function Router() {
  const { path } = useRoute();
  const { user } = useAuth();
  const isApp = path.startsWith('/app');
// The useEffect hook is used to perform side effects in the Router component. It checks the current path and user authentication status, and navigates to the appropriate page based on these conditions. It also scrolls to the top of the page when navigating to a non-app route.
  useEffect(() => {
    if (isApp && !user) navigate('/login', true);
    if (path === '/app') navigate('/app/dashboard', true);
    if ((path === '/login' || path === '/register') && user) navigate('/app/dashboard', true);
    if (!isApp) window.scrollTo(0, 0);
  }, [path, user, isApp]);
// The Router component conditionally renders different pages based on the current path and user authentication status. It returns the appropriate page component for each route, or a NotFound component if the route does not match any defined paths.
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
// exporting the App component as the default export of this module. The App component serves as the root component of the application, wrapping the entire application in various context providers and rendering the Router and ChatGate components.
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
