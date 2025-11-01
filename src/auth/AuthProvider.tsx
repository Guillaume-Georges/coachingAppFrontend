import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type User = { id: string; email: string; role: 'member'|'coach'|'admin'|'superadmin' };
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
  const [user, setUser] = useState<User | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const tokenExp = useRef<number>(0);
  const refreshing = useRef<Promise<string | undefined> | null>(null);

  useEffect(() => {
    // Attempt session restore on load via refresh endpoint (cookie-based in real backend)
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        applySession(data);
      } catch {}
      finally {
        setReady(true);
      }
    })();
  }, []);

  const refreshTimer = useRef<number | null>(null);

  function scheduleProactiveRefresh(expiresInSec?: number) {
    if (!expiresInSec) return;
    if (refreshTimer.current) { window.clearTimeout(refreshTimer.current); refreshTimer.current = null; }
    const skew = 10; // seconds early
    const delay = Math.max(1000, (expiresInSec - skew) * 1000);
    refreshTimer.current = window.setTimeout(() => { refresh().catch(() => {}); }, delay);
  }

  function applySession(data: { accessToken: string; user: User; expiresIn?: number }) {
    setUser(data.user);
    setToken(data.accessToken);
    tokenExp.current = Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 10 * 60 * 1000);
    if (data.expiresIn) scheduleProactiveRefresh(data.expiresIn);
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
    if (refreshTimer.current) { window.clearTimeout(refreshTimer.current); refreshTimer.current = null; }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshing.current) return refreshing.current;
    refreshing.current = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) throw new Error('No session');
        const data = await res.json();
        applySession(data);
        return data.accessToken as string;
      } catch {
        setUser(undefined); setToken(undefined); tokenExp.current = 0; return undefined;
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
