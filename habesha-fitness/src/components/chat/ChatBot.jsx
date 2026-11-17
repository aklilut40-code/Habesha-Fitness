import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { useLang } from '../../i18n/LangContext';
import { UI, trIn } from '../../i18n/translations';
import { useData } from '../../store/DataContext';
import { money } from '../../utils/format';
import { SUGGESTIONS, answer, fillAnswer, INTENTS, FALLBACK, wantsAI } from '../../chat/knowledge';

// Optional AI backend (see the habesha-fitness-backend folder). Set VITE_API_URL in .env to turn it on, e.g. http://localhost:4000
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Floating FAQ assistant. Answers in the language the visitor writes in (English, Amharic, Tigrinya).
export default function ChatBot() {
  const { lang: uiLang, t } = useLang();
  const { settings, plans } = useData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([]); // { id, from: 'user' | 'bot', text }
  const [typing, setTyping] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const idRef = useRef(0);
  const timer = useRef(null);
  const alive = useRef(true);

  // Live gym data used inside answers, written in the answer's language.
  const ctxFor = useMemo(() => (lang) => {
    const ui = UI[lang] || UI.en;
    const dict = (x) => trIn(lang, x);
    return {
      gym: settings.gymName,
      phone: settings.phone,
      email: settings.email,
      address: dict(settings.address),
      hours: dict(settings.hours),
      plans: plans.map((p) => `• ${dict(p.name)} — ${money(p.price)} / ${p.durationMonths === 1 ? ui.perMonth : fillAnswer(ui.perMonths, { n: p.durationMonths })}`).join('\n'),
    };
  }, [settings, plans]);

  const welcome = useMemo(() => {
    const greet = INTENTS.find((i) => i.id === 'greeting');
    return fillAnswer(greet.a[uiLang], ctxFor(uiLang));
  }, [uiLang, ctxFor]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing, open]);

  useEffect(() => {
    if (!open) return undefined;
    const t0 = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t0); document.removeEventListener('keydown', onKey); };
  }, [open]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearTimeout(timer.current); };
  }, []);

  const send = (raw, forcedLang) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMsgs((m) => [...m, { id: ++idRef.current, from: 'user', text }]);
    setInput('');
    setTyping(true);
    timer.current = setTimeout(async () => {
      // Suggestion buttons already know their language; typed text is detected from its script and words.
      const res = answer(text, { uiLang, forceLang: forcedLang, getCtx: ctxFor });
      let reply = res.text;
      // Ask the backend's AI when no built-in topic matched, or when the question is general fitness/health/sport.
      // Any problem (offline, AI off, limit reached) silently keeps a built-in answer.
      const general = !forcedLang && wantsAI(text);
      if (general) reply = fillAnswer(FALLBACK[res.lang], ctxFor(res.lang));
      if (API_URL && (!res.intent || general)) {
        try {
          const r = await fetch(`${API_URL}/api/chat/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, lang: res.lang, history: msgs.slice(-6).map(({ from, text: t }) => ({ from, text: t })) }),
          });
          const j = r.ok ? await r.json() : null;
          if (j?.answer) reply = j.answer;
        } catch { /* keep the built-in answer */ }
      }
      if (!alive.current) return;
      setMsgs((m) => [...m, { id: ++idRef.current, from: 'bot', text: reply }]);
      setTyping(false);
    }, 450);
  };

  const onSubmit = (e) => { e.preventDefault(); send(input); };

  return (
    <div className="chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label={t('chatTitle')}>
          <header className="chat-head">
            <span className="chat-avatar"><Icon name="dumbbell" size={18} /></span>
            <div className="chat-head-text">
              <strong>{t('chatTitle')}</strong>
              <small>{t('chatSub')}</small>
            </div>
            <button type="button" className="icon-btn icon-btn-ghost" onClick={() => setOpen(false)} aria-label={t('chatClose')}><Icon name="x" size={18} /></button>
          </header>

          <div className="chat-log" ref={logRef} role="log" aria-live="polite">
            <div className="chat-msg bot">{welcome}</div>
            {msgs.length === 0 && (
              <div className="chat-chips">
                {SUGGESTIONS[uiLang].map((s) => (
                  <button key={s} type="button" className="chat-chip" onClick={() => send(s, uiLang)}>{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={`chat-msg ${m.from}`}>{m.text}</div>
            ))}
            {typing && <div className="chat-msg bot chat-typing" aria-label="…"><i /><i /><i /></div>}
          </div>

          <form className="chat-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatPlaceholder')}
              aria-label={t('chatPlaceholder')}
              maxLength={300}
              autoComplete="off"
            />
            <button type="submit" className="chat-send" disabled={!input.trim() || typing} aria-label={t('chatSend')}><Icon name="send" size={18} /></button>
          </form>
          <p className="chat-note">{t('chatNote')}</p>
        </section>
      )}

      <button type="button" className={`chat-fab ${open ? 'is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label={open ? t('chatClose') : t('chatOpen')} aria-expanded={open}>
        <Icon name={open ? 'x' : 'chat'} size={24} />
      </button>
    </div>
  );
}
