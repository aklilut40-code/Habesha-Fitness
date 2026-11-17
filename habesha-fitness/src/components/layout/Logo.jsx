export default function Logo({ name = 'Habesha', compact = false }) {
  return (
    <span className="logo">
      <span className="logo-mark">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M7 12v8M25 12v8M11 9v14M21 9v14M11 16h10" /></svg>
      </span>
      {!compact && <span className="logo-text">{name.split(' ')[0].toUpperCase()}</span>}
    </span>
  );
}
