import Icon from './Icon';

export default function Button({ variant = 'primary', size = 'md', icon, iconRight, loading, children, className = '', type = 'button', ...rest }) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>
  );
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className = '', ...rest }) {
  return (
    <button type="button" className={`icon-btn icon-btn-${variant} icon-btn-${size} ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 15 : 17} />
    </button>
  );
}
