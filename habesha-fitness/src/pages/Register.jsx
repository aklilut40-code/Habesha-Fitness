import { useState } from 'react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import { Input, PasswordInput, Select } from '../components/ui/Field';
import { Link, navigate } from '../store/router';
import { useAuth } from '../store/AuthContext';
import { useData } from '../store/DataContext';
import { useToast } from '../components/ui/Toast';
import { isEmail, isPhone, passwordIssue } from '../utils/validators';
import { useLang } from '../i18n/LangContext';

const EMPTY = { name: '', email: '', phone: '', gender: '', password: '', confirm: '' };

export default function Register() {
  const { register } = useAuth();
  const { members, addMember } = useData();
  const toast = useToast();
  const { t, tr } = useLang();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = t('errName');
    if (!isEmail(form.email)) e.email = t('errEmail');
    if (!isPhone(form.phone)) e.phone = t('errPhone');
    if (!form.gender) e.gender = t('errGender');
    const pw = passwordIssue(form.password);
    if (pw) e.password = tr(pw);
    if (form.confirm !== form.password) e.confirm = t('errMismatch');
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const res = await register(form);
    setBusy(false);
    if (!res.ok) {
      setErrors({ email: tr(res.error) });
      toast.error(tr(res.error));
      return;
    }
    // A new registration also appears in the members list as "Pending".
    if (!members.some((m) => m.email.toLowerCase() === form.email.trim().toLowerCase())) {
      addMember({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), gender: form.gender });
    }
    toast.success(t('regSuccess'));
    navigate('/app/dashboard');
  };

  return (
    <AuthShell
      image="fitness"
      title={t('regTitle')}
      subtitle={t('regSub')}
      footer={<>{t('haveAccount')} <Link to="/login">{t('loginLink')}</Link></>}
    >
      <form onSubmit={submit} noValidate className="form">
        <Input label={t('fullName')} icon="user" placeholder="Jane Doe" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <div className="grid-2">
          <Input label={t('email')} type="email" icon="mail" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <Input label={t('phone')} type="tel" icon="phone" placeholder="+251 9…" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
        </div>
        <Select label={t('gender')} value={form.gender} onChange={set('gender')} error={errors.gender}>
          <option value="">{t('select')}</option>
          <option value="Female">{t('female')}</option>
          <option value="Male">{t('male')}</option>
          <option value="Other">{t('other')}</option>
        </Select>
        <div className="grid-2">
          <PasswordInput label={t('password')} placeholder={t('pwPh')} value={form.password} onChange={set('password')} error={errors.password} hint={t('pwHint')} autoComplete="new-password" />
          <PasswordInput label={t('confirmPw')} placeholder={t('confirmPh')} value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">{t('createBtn')}</Button>
      </form>
    </AuthShell>
  );
}
