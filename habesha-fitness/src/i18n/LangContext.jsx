import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DATA, LANGUAGES, UI } from './translations';

const KEY = 'habesha.lang';
const Ctx = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch { /* storage unavailable */ }
  return 'en';
}

// Fill {placeholders} in a string.
const fill = (str, vars) => (vars ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : str);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem(KEY, code); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => {
    // t(key, vars): fixed interface text. Falls back to English, then to the key itself.
    const t = (key, vars) => fill(UI[lang]?.[key] ?? UI.en[key] ?? key, vars);
    // tr(englishText): translates sample data by its English text; unknown text is shown as typed.
    const tr = (text) => (lang === 'en' ? text : DATA[lang]?.[text] ?? text);
    return { lang, setLang, t, tr };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used inside <LangProvider>');
  return v;
}
