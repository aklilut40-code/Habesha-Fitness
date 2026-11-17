import { useState } from 'react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, PasswordInput } from '../components/ui/Field';
import { Link, navigate } from '../store/router';
import { DEMO_ADMIN, useAuth } from '../store/AuthContext';
import { useToast } from '../components/ui/Toast';
import { isEmail } from '../utils/validators';
import { useLang } from '../i18n/LangContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const { t, tr } = useLang();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetErr, setResetErr] = useState('');

  const set = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.email.trim()) er.email = t('errEmailReq');
    else if (!isEmail(form.email)) er.email = t('errEmail');
    if (!form.password) er.password = t('errPwReq');
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const res = await login(form.email, form.password, form.remember);
    setBusy(false);
    if (!res.ok) {
      setErrors({ form: tr(res.error) });
      toast.error(tr(res.error));
      return;
    }
    toast.success(t('welcomeToast'));
    navigate('/app/dashboard');
  };

  const sendReset = (e) => {
    e.preventDefault();
    if (!isEmail(resetEmail)) return setResetErr(t('errEmail'));
    setForgot(false);
    setResetEmail('');
    setResetErr('');
    toast.info(t('resetToast'));
  };

  return (
    <AuthShell
      title={t('welcomeBack')}
      subtitle={t('loginSub')}
      footer={<>{t('newHere')} <Link to="/register">{t('createAccount')}</Link></>}
    >
      <div className="demo-creds">
        <div><small>{t('demoAdmin')}</small><code>{DEMO_ADMIN.email}</code><code>{DEMO_ADMIN.password}</code></div>
        <Button size="sm" variant="outline" onClick={() => setForm({ ...form, email: DEMO_ADMIN.email, password: DEMO_ADMIN.password })}>{t('fillIn')}</Button>
      </div>
      <form onSubmit={submit} noValidate className="form">
        {errors.form && <div className="form-alert" role="alert">{errors.form}</div>}
        <Input label={t('email')} type="email" icon="mail" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <PasswordInput label={t('password')} placeholder={t('passwordPh')} value={form.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
        <div className="row-between">
          <label className="check"><input type="checkbox" checked={form.remember} onChange={set('remember')} /> {t('remember')}</label>
          <button type="button" className="link-btn" onClick={() => setForgot(true)}>{t('forgot')}</button>
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">{t('loginBtn')}</Button>
      </form>

      <Modal
        open={forgot}
        title={t('resetTitle')}
        onClose={() => setForgot(false)}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setForgot(false)}>{t('cancel')}</Button><Button onClick={sendReset}>{t('sendReset')}</Button></>}
      >
        <form onSubmit={sendReset} noValidate>
          <p className="muted small">{t('resetText')}</p>
          <Input label={t('email')} type="email" icon="mail" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} error={resetErr} />
        </form>
      </Modal>
    </AuthShell>
  );
}
