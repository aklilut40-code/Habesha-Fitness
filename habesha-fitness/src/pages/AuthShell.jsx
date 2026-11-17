import Logo from '../components/layout/Logo';
import Icon from '../components/ui/Icon';
import { Link } from '../store/router';
import { IMAGES } from '../store/images';
import LanguageSelect from '../components/ui/LanguageSelect';
import { useLang } from '../i18n/LangContext';

export default function AuthShell({ title, subtitle, image = 'hero', children, footer }) {
  const { t } = useLang();
  return (
    <div className="auth">
      <div className="auth-side" style={{ backgroundImage: `url(${IMAGES[image]})` }}>
        <div className="auth-side-overlay">
          <Link to="/" className="auth-brand"><Logo /></Link>
          <div>
            <h2>{t('authTagline')}</h2>
            <p>{t('authSub')}</p>
          </div>
        </div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-top">
            <Link to="/" className="auth-back"><Icon name="left" size={15} /> {t('backToSite')}</Link>
            <LanguageSelect />
          </div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          <div className="demo-note">
            <Icon name="shield" size={16} />
            <span><b>{t('demoTitle')}</b> {t('demoText')}</span>
          </div>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </div>
    </div>
  );
}
