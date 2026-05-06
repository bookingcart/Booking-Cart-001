import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_USER         = 'bookingcart_user';
const STORAGE_GOOGLE_TOKEN = 'bookingcart_google_id_token';
const STORAGE_JWT_TOKEN    = 'bookingcart_jwt_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  /** Returns the best available token (Google ID token or our JWT) */
  const getToken = useCallback(() => {
    try {
      return (
        localStorage.getItem(STORAGE_GOOGLE_TOKEN) ||
        localStorage.getItem(STORAGE_JWT_TOKEN)    ||
        ''
      );
    } catch {
      return '';
    }
  }, [tick]);

  /** Alias kept for backward compat with legacy JS that calls getGoogleIdToken() */
  const getGoogleIdToken = getToken;

  const authHeaders = useCallback(() => {
    const t = getToken();
    const h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }, [getToken]);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [tick]);

  /** Sign out: clears all tokens and user data, updates UI */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    try {
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_GOOGLE_TOKEN);
      localStorage.removeItem(STORAGE_JWT_TOKEN);
      localStorage.removeItem('bc_user');
    } catch {}
    refresh();
    if (typeof window.applyAuthUI === 'function') window.applyAuthUI();
  }, [refresh]);

  const value = useMemo(
    () => ({ getGoogleIdToken, getToken, authHeaders, user, refresh, logout }),
    [getGoogleIdToken, getToken, authHeaders, user, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
