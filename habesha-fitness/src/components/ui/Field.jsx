import { useState } from 'react';
import Icon from './Icon';

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function Input({ label, error, hint, id, icon, ...rest }) {
  const fid = id || `f-${(label || rest.name || 'x').toString().toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={fid}>
      <div className="input-wrap">
        {icon && <Icon name={icon} size={17} className="input-icon" />}
        <input id={fid} className={`input ${icon ? 'with-icon' : ''}`} aria-invalid={!!error} {...rest} />
      </div>
    </Field>
  );
}

export function PasswordInput({ label, error, hint, id, ...rest }) {
  const [show, setShow] = useState(false);
  const fid = id || `f-${(label || 'password').toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={fid}>
      <div className="input-wrap">
        <Icon name="lock" size={17} className="input-icon" />
        <input id={fid} className="input with-icon with-action" type={show ? 'text' : 'password'} aria-invalid={!!error} {...rest} />
        <button type="button" className="input-action" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          <Icon name={show ? 'eyeoff' : 'eye'} size={17} />
        </button>
      </div>
    </Field>
  );
}

export function Select({ label, error, hint, id, children, ...rest }) {
  const fid = id || `f-${(label || rest.name || 'sel').toString().toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={fid}>
      <select id={fid} className="input select" aria-invalid={!!error} {...rest}>{children}</select>
    </Field>
  );
}

export function Textarea({ label, error, hint, id, ...rest }) {
  const fid = id || `f-${(label || rest.name || 'ta').toString().toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={fid}>
      <textarea id={fid} className="input textarea" aria-invalid={!!error} {...rest} />
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="input-wrap search-box">
      <Icon name="search" size={17} className="input-icon" />
      <input className="input with-icon" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}
