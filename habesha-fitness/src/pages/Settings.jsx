import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { Input, PasswordInput, Select, Toggle } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { navigate } from '../store/router';
import { isEmail, isPhone, passwordIssue } from '../utils/validators';
// The Settings component is responsible for rendering the user profile and gym settings page.
//  It allows users to update their profile information, change their password, manage gym settings, 
// and configure notification preferences. The component uses various hooks to manage state, 
// handle form submissions, and display toast notifications for feedback.
export default function Settings() {
  const { settings, notifications, updateSettings, updateNotifications, resetDemo } = useData();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user.name, email: user.email, phone: user.phone || '', gender: user.gender || '' });
  const [pErr, setPErr] = useState({});
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [wErr, setWErr] = useState({});
  const [gym, setGym] = useState(settings);
  const [gErr, setGErr] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);
// The saveProfile function is an asynchronous function that handles the submission of the user profile form. 
// It validates the input fields, updates the profile using the updateProfile function from the AuthContext, 
// and displays success or error messages using toast notifications.
  const saveProfile = async (e) => {
    e.preventDefault();
    const er = {};
    if (profile.name.trim().length < 3) er.name = 'Enter your full name';
    if (!isEmail(profile.email)) er.email = 'Enter a valid email';
    if (!isPhone(profile.phone)) er.phone = 'Enter a valid phone number';
    setPErr(er);
    if (Object.keys(er).length) return toast.error('Please fix the highlighted fields.');
    await updateProfile({ name: profile.name.trim(), phone: profile.phone.trim(), gender: profile.gender });
    toast.success('Profile updated.');
  };
// The savePassword function is an asynchronous function that handles the submission of the change password form.
// It validates the current password, new password, and confirmation password fields, 
// updates the password using the changePassword function from the AuthContext, 
// and displays success or error messages using toast notifications.
  const savePassword = async (e) => {
    e.preventDefault();
    const er = {};
    if (!pw.current) er.current = 'Enter your current password';
    const issue = passwordIssue(pw.next);
    if (issue) er.next = issue;
    if (pw.confirm !== pw.next) er.confirm = 'Passwords do not match';
    setWErr(er);
    if (Object.keys(er).length) return;
    const res = await changePassword(pw.current, pw.next);
    if (!res.ok) { setWErr({ current: res.error }); return toast.error(res.error); }
    setPw({ current: '', next: '', confirm: '' });
    toast.success('Password changed (demo account only).');
  };

  const saveGym = (e) => {
    e.preventDefault();
    const er = {};
    if (!gym.gymName.trim()) er.gymName = 'Gym name is required';
    if (!isEmail(gym.email)) er.email = 'Enter a valid email';
    if (!isPhone(gym.phone)) er.phone = 'Enter a valid phone number';
    if (!gym.address.trim()) er.address = 'Address is required';
    if (!gym.hours.trim()) er.hours = 'Opening hours are required';
    setGErr(er);
    if (Object.keys(er).length) return toast.error('Please fix the highlighted fields.');
    updateSettings({ gymName: gym.gymName.trim(), email: gym.email.trim(), phone: gym.phone.trim(), address: gym.address.trim(), hours: gym.hours.trim() });
    toast.success('Gym settings saved. They appear on the public website.');
  };

  const toggle = (key, label) => (v) => { updateNotifications({ [key]: v }); toast.info(`${label} ${v ? 'enabled' : 'disabled'} (preference saved; no real notifications are sent in this demo).`); };

  const doLogout = () => { logout(); toast.info('You have been logged out.'); navigate('/login'); };

  return (
    <div className="stack">
      <PageHeader title="Profile & settings" subtitle="Manage your account and gym preferences">
        <Button variant="outline" icon="logout" onClick={doLogout}>Logout</Button>
      </PageHeader>

      <div className="grid-2-eq">
        <Card title="Your profile" subtitle="Shown in the top bar">
          <div className="profile-head"><Avatar name={profile.name} size={64} /><div><b>{user.name}</b><small>{user.role}</small></div></div>
          <form onSubmit={saveProfile} noValidate className="form">
            <Input label="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} error={pErr.name} />
            <Input label="Email" type="email" value={profile.email} disabled hint="Email is your demo login and can't be changed" />
            <div className="grid-2">
              <Input label="Phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} error={pErr.phone} />
              <Select label="Gender" value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}><option value="">Not set</option><option>Female</option><option>Male</option><option>Other</option></Select>
            </div>
            <div className="form-actions"><Button type="submit">Save profile</Button></div>
          </form>
        </Card>

        <Card title="Change password" subtitle="Demo account password — stored only in this browser">
          <form onSubmit={savePassword} noValidate className="form">
            <PasswordInput label="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={wErr.current} autoComplete="current-password" />
            <PasswordInput label="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={wErr.next} hint="8+ characters, letters and numbers" autoComplete="new-password" />
            <PasswordInput label="Confirm new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={wErr.confirm} autoComplete="new-password" />
            <div className="form-actions"><Button type="submit">Update password</Button></div>
          </form>
        </Card>
      </div>

      <div className="grid-2-eq">
        <Card title="Gym settings" subtitle="Used across the dashboard and public website">
          <form onSubmit={saveGym} noValidate className="form">
            <Input label="Gym name" value={gym.gymName} onChange={(e) => setGym({ ...gym, gymName: e.target.value })} error={gErr.gymName} />
            <div className="grid-2">
              <Input label="Contact email" type="email" value={gym.email} onChange={(e) => setGym({ ...gym, email: e.target.value })} error={gErr.email} />
              <Input label="Contact phone" type="tel" value={gym.phone} onChange={(e) => setGym({ ...gym, phone: e.target.value })} error={gErr.phone} />
            </div>
            <Input label="Address" value={gym.address} onChange={(e) => setGym({ ...gym, address: e.target.value })} error={gErr.address} />
            <Input label="Opening hours" value={gym.hours} onChange={(e) => setGym({ ...gym, hours: e.target.value })} error={gErr.hours} />
            <div className="form-actions"><Button type="submit">Save settings</Button></div>
          </form>
        </Card>

        <Card title="Notification preferences" subtitle="Preferences are saved; delivery is simulated">
          <div className="toggles">
            <Toggle checked={notifications.newMember} onChange={toggle('newMember', 'New member alerts')} label="New member alerts" description="When someone registers" />
            <Toggle checked={notifications.payment} onChange={toggle('payment', 'Payment alerts')} label="Payment alerts" description="Pending and failed payments" />
            <Toggle checked={notifications.expiry} onChange={toggle('expiry', 'Expiry reminders')} label="Expiry reminders" description="Memberships ending within 7 days" />
            <Toggle checked={notifications.weekly} onChange={toggle('weekly', 'Weekly report')} label="Weekly summary report" description="A digest every Monday" />
          </div>
          <div className="danger-zone">
            <div><b>Reset demo data</b><small>Restore the original sample members, payments and attendance.</small></div>
            <Button variant="danger-ghost" icon="refresh" onClick={() => setConfirmReset(true)}>Reset</Button>
          </div>
        </Card>
      </div>

      <Modal open={confirmReset} title="Reset demo data?" size="sm" onClose={() => setConfirmReset(false)} footer={<><Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button><Button variant="danger" onClick={() => { resetDemo(); setGym((g) => g); setConfirmReset(false); toast.success('Demo data restored.'); setTimeout(() => window.location.reload(), 600); }}>Reset everything</Button></>}>
        <p className="confirm-text">All changes you made to members, trainers, plans, payments, attendance and settings will be replaced with the original sample data.</p>
      </Modal>
    </div>
  );
}
