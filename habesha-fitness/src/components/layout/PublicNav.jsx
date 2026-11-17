import { useEffect, useState } from 'react';
import Logo from './Logo';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { Link, navigate } from '../../store/router';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import LanguageSelect from '../ui/LanguageSelect';
import { useLang } from '../../i18n/LangContext';

export const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const LINKS = [
  ['programs', 'navPrograms'],
  ['trainers', 'navTrainers'],
  ['plans', 'navMembership'],
  ['reviews', 'navReviews'],
  ['contact', 'navContact'],
];

export default function PublicNav({ onLanding = false }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { settings } = useData();
  const { user } = useAuth();
  const { t } = useLang();

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 20);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const go = (id) => {
    setOpen(false);
    if (onLanding) scrollToSection(id);
    else {
      navigate('/');
      setTimeout(() => scrollToSection(id), 120);
    }
  };

  return (
    <header className={`pubnav ${solid || open ? 'solid' : ''}`}>
      <div className="container pubnav-in">
        <Link to="/" className="pubnav-brand" onClick={() => { setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Logo name={settings.gymName} />
        </Link>
        <nav className={`pubnav-links ${open ? 'open' : ''}`} aria-label="Public navigation">
          {LINKS.map(([id, key]) => (
            <button key={id} type="button" className="pubnav-link" onClick={() => go(id)}>{t(key)}</button>
          ))}
          <div className="pubnav-cta-mobile">
            <LanguageSelect className="lang-select-mobile" />
            {user ? (
              <Button onClick={() => navigate('/app/dashboard')} iconRight="arrow">{t('openDashboard')}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>{t('login')}</Button>
                <Button onClick={() => navigate('/register')}>{t('join')}</Button>
              </>
            )}
          </div>
        </nav>
        <div className="pubnav-cta">
          <LanguageSelect />
          {user ? (
            <Button size="sm" onClick={() => navigate('/app/dashboard')} iconRight="arrow">{t('dashboard')}</Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>{t('login')}</Button>
              <Button size="sm" onClick={() => navigate('/register')}>{t('join')}</Button>
            </>
          )}
        </div>
        <button type="button" className="icon-btn icon-btn-ghost pubnav-burger" onClick={() => setOpen(!open)} aria-label={open ? t('menuClose') : t('menuOpen')} aria-expanded={open}>
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
      </div>
    </header>
  );
}
