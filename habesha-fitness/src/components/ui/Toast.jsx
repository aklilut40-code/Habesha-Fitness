import { createContext, useCallback, useContext, useState } from 'react';
import Icon from './Icon';

const Ctx = createContext(null);
let n = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((s) => s.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = ++n;
      setItems((s) => [...s.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 5500 : 3600);
    },
    [dismiss]
  );

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'success' ? 'checkcircle' : t.type === 'error' ? 'alert' : 'info'} size={18} />
            <span>{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
