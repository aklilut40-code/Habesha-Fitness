import { LANGUAGES } from '../../i18n/translations';
import { useLang } from '../../i18n/LangContext';
import Icon from './Icon';

// Small language dropdown (English / አማርኛ / ትግርኛ). Used on the public site and auth pages.
export default function LanguageSelect({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <label className={`lang-select ${className}`}>
      <Icon name="globe" size={15} />
      <span className="sr-only">{t('language')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('language')}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
