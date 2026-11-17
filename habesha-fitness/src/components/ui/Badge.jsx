const TONES = {
  Active: 'success', Paid: 'success', Present: 'success', Completed: 'success',
  Expired: 'danger', Failed: 'danger',
  Pending: 'warning', Inside: 'info',
  Beginner: 'success', Intermediate: 'warning', Advanced: 'danger', 'All levels': 'info',
};

export default function Badge({ children, tone, dot = true }) {
  const t = tone || TONES[children] || 'neutral';
  return (
    <span className={`badge badge-${t}`}>
      {dot && <i className="badge-dot" />}
      {children}
    </span>
  );
}
