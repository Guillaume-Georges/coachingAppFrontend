import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type User = { id: string; email: string; role: 'member'|'coach'|'admin'|'superadmin'; emailVerified?: boolean };
type AuthContextType = {
  isAuthenticated: boolean;
  ready: boolean;
  user?: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | undefined>;
  register: (payload: { email: string; password: string; name?: string; role?: 'member'|'admin'; adminSecret?: string }) => Promise<{ id: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const API_BASE = (import.meta.env.VITE_MOCK_API === 'true') ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '');
  const DEV = import.meta.env.DEV;
  const USE_HEADER_REFRESH = (import.meta.env.VITE_USE_HEADER_REFRESH as string | undefined) === 'true' && (import.meta.env.VITE_MOCK_API !== 'true');
  const DEV_PERSIST_REFRESH = (import.meta.env.VITE_DEV_PERSIST_REFRESH as string | undefined) === 'true';
  const [user, setUser] = useState<User | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const tokenExp = useRef<number>(0);
  const refreshing = useRef<Promise<string | undefined> | null>(null);
  const refreshTokenRef = useRef<string | undefined>(undefined);

  // Dev-only optional persistence of refresh token (not for production)
  useEffect(() => {
    if (DEV && DEV_PERSIST_REFRESH) {
      try {
        const stored = window.localStorage.getItem('app_refresh_token');
        if (stored) refreshTokenRef.current = stored;
      } catch {}
    }
  }, []);

  useEffect(() => {
    // Attempt session restore on load (header in dev if we have a refreshToken, else cookie)
    (async () => {
      try {
        await refresh();
      } catch {}
      finally {
        setReady(true);
      }
    })();
    // Intentionally run once on mount; refresh is stable but defined below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshTimer = useRef<number | null>(null);

  function scheduleProactiveRefresh(expiresInSec?: number) {
    if (!expiresInSec) return;
    if (refreshTimer.current) { window.clearTimeout(refreshTimer.current); refreshTimer.current = null; }
    const skew = 10; // seconds early
    const delay = Math.max(1000, (expiresInSec - skew) * 1000);
    refreshTimer.current = window.setTimeout(() => { refresh().catch(() => {}); }, delay);
  }

  function applySession(data: { accessToken: string; user: User; expiresIn?: number; refreshToken?: string }) {
    setUser(data.user);
    setToken(data.accessToken);
    tokenExp.current = Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 10 * 60 * 1000);
    if (data.expiresIn) scheduleProactiveRefresh(data.expiresIn);
    if (USE_HEADER_REFRESH) {
      if (data.refreshToken) {
        refreshTokenRef.current = data.refreshToken;
        if (DEV && DEV_PERSIST_REFRESH) {
          try { window.localStorage.setItem('app_refresh_token', data.refreshToken); } catch {}
        }
      } else {
        refreshTokenRef.current = undefined;
        if (DEV && DEV_PERSIST_REFRESH) {
          try { window.localStorage.removeItem('app_refresh_token'); } catch {}
        }
      }
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    applySession(data);
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; name?: string; role?: 'member'|'admin'; adminSecret?: string }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Registration failed');
    return data as { id: string };
  }, []);

  const logout = useCallback(async () => {
    try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    setUser(undefined);
    setToken(undefined);
    tokenExp.current = 0;
    refreshTokenRef.current = undefined;
    if (DEV && DEV_PERSIST_REFRESH) { try { window.localStorage.removeItem('app_refresh_token'); } catch {} }
    // Clear persisted React Query cache (both our custom key and default key, just in case)
    try { window.localStorage.removeItem('APP_RQ_CACHE'); } catch {}
    try { window.localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE'); } catch {}
    // Let app-level listeners clear in-memory query cache as well
    try { window.dispatchEvent(new CustomEvent('app-cache-clear')); } catch {}
    if (refreshTimer.current) { window.clearTimeout(refreshTimer.current); refreshTimer.current = null; }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshing.current) return refreshing.current;
    refreshing.current = (async () => {
      try {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        let body: any = undefined;
        if (USE_HEADER_REFRESH && refreshTokenRef.current) {
          headers['X-Refresh-Token'] = refreshTokenRef.current;
          // Backend also accepts JSON body; not required but safe to include
          body = JSON.stringify({ refreshToken: refreshTokenRef.current });
        }
        const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include', headers, body });
        if (!res.ok) throw new Error('No session');
        const data = await res.json();
        applySession(data);
        // If backend rotates refresh tokens and returns a new one (dev only)
        if ((data as any)?.refreshToken && USE_HEADER_REFRESH) {
          refreshTokenRef.current = (data as any).refreshToken;
          if (DEV && DEV_PERSIST_REFRESH) { try { window.localStorage.setItem('app_refresh_token', (data as any).refreshToken); } catch {} }
        }
        return data.accessToken as string;
      } catch {
        // Soft-fail refresh: keep current user/token state to avoid abrupt
        // redirects (e.g., during profile save) and let APIs fall back to
        // cookie-based auth if available. We only clear state on explicit logout.
        // getToken will still return undefined once token is considered expired
        // (via tokenExp), so Authorization header won't be sent.
        return undefined;
      } finally {
        refreshing.current = null;
      }
    })();
    return refreshing.current;
  }, [API_BASE]);

  const getToken = useCallback(async () => {
    if (token && Date.now() < tokenExp.current - 30_000) return token;
    return await refresh();
  }, [token, refresh]);

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated: !!user && !!token,
    ready,
    user,
    login,
    logout,
    getToken,
    register,
  }), [user, token, ready, login, logout, getToken, register]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppAuthProvider');
  return ctx;
}
