import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { navigate } from '../store/router';

export default function NotFound({ standalone }) {
  const body = (
    <EmptyState
      icon="alert"
      title="Page not found"
      text="The page you're looking for doesn't exist."
      action={<Button onClick={() => navigate(standalone ? '/' : '/app/dashboard')}>{standalone ? 'Back to home' : 'Back to dashboard'}</Button>}
    />
  );
  return standalone ? <div className="center-screen">{body}</div> : body;
}
