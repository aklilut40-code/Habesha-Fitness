import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken, getToken } from '../utils/api';

const SESSION_KEY = 'habesha.demo.session';
export const DEMO_ADMIN = { email: 'admin@habesha.demo', password: 'Admin1234' };

const Ctx = createContext(null);

const read = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (k, v) => {
  try {
    if (v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

function formatUser(u) {
  if (!u) return null;
  return {
    ...u,
    role: u.title || (u.role === 'admin' ? 'Gym Administrator' : u.role || 'Member'),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => formatUser(read(SESSION_KEY, null)));

  // On initial load, verify current session token with the backend
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.me().then((res) => {
        if (res.ok && res.data?.user) {
          const u = formatUser(res.data.user);
          setUser(u);
          write(SESSION_KEY, u);
        } else if (res.status === 401) {
          setToken('');
          setUser(null);
          write(SESSION_KEY, null);
        }
      });
    }
  }, []);

  const persistSession = (u, remember) => {
    setUser(u);
    if (remember === false) {
      write(SESSION_KEY, null);
    } else {
      write(SESSION_KEY, u);
    }
  };

  const login = useCallback(async (email, password, remember) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await api.login(cleanEmail, password);

    if (res.ok && res.data?.token) {
      setToken(res.data.token);
      const safe = formatUser(res.data.user);
      persistSession(safe, remember);
      return { ok: true };
    }

    return { ok: false, error: res.error || 'Incorrect email or password.' };
  }, []);

  const register = useCallback(async (form) => {
    const res = await api.register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      gender: form.gender,
      password: form.password,
    });

    if (res.ok && res.data?.token) {
      setToken(res.data.token);
      const safe = formatUser(res.data.user);
      persistSession(safe, true);
      return { ok: true };
    }

    return { ok: false, error: res.error || 'Registration failed' };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    setToken('');
    setUser(null);
    write(SESSION_KEY, null);
  }, []);

  const updateProfile = useCallback(
    async (changes) => {
      const res = await api.updateProfile(changes);
      if (res.ok && res.data?.user) {
        const next = formatUser(res.data.user);
        setUser(next);
        write(SESSION_KEY, next);
        return { ok: true };
      }
      return { ok: false, error: res.error };
    },
    []
  );

  const changePassword = useCallback(
    async (current, next) => {
      const res = await api.changePassword(current, next);
      if (res.ok) return { ok: true };
      return { ok: false, error: res.error || 'Could not change password' };
    },
    []
  );

  const value = useMemo(
    () => ({ user, login, register, logout, updateProfile, changePassword }),
    [user, login, register, logout, updateProfile, changePassword]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
