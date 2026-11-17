import Icon from './Icon';

export default function StatCard({ icon, label, value, hint, tone = 'accent' }) {
  return (
    <div className="stat">
      <div className={`stat-icon tone-${tone}`}><Icon name={icon} size={20} /></div>
      <div className="stat-text">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
    </div>
  );
}
