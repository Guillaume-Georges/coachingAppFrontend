import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserProfile } from '../features/user/useUserProfile';
import { useAuth } from '../auth/AuthProvider';
import { useApi } from '../api';
import toast from 'react-hot-toast';
import { BookOpenIcon, UserCircleIcon, HomeIcon, UsersIcon } from '@heroicons/react/24/outline';

const baseNav = [
  { to: '/programs', label: 'Programs' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/app/plan', label: 'Plan' },
  { to: '/leaderboard/members', label: 'Leaderboard' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/app/progress', label: 'Progress' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, ready, logout, user } = useAuth() as any;
  const { data: profile } = useUserProfile();
  const loc = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'));
  // simplified nav – no workout shortcut
  const loginInFlight = useRef(false);
  const lastLoginAt = useRef(0);
  const api = useApi();

  useEffect(() => {
    const handler = () => {
      if (isAuthenticated) return;
      const now = Date.now();
      if (loginInFlight.current || now - lastLoginAt.current < 2000) return; // throttle
      loginInFlight.current = true;
      lastLoginAt.current = now;
      navigate('/login', { replace: false, state: { returnTo: loc.pathname } });
      setTimeout(() => { loginInFlight.current = false; }, 500);
    };
    window.addEventListener('app-auth-login', handler as any);
    return () => window.removeEventListener('app-auth-login', handler as any);
  }, [navigate, loc.pathname, isAuthenticated]);

  function toggleDark() {
    const next = !dark; setDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  const tabs = useMemo(() => {
    const items = [
      { to: '/home', label: 'Home', icon: HomeIcon },
      { to: '/exercises', label: 'Library', icon: BookOpenIcon },
    ];
    if (ready && isAuthenticated && (profile?.role === 'admin' || profile?.role === 'superadmin')) {
      items.push({ to: '/admin/members', label: 'Members', icon: UsersIcon });
    }
    if (ready && isAuthenticated) items.push({ to: '/profile', label: 'Profile', icon: UserCircleIcon });
    return items;
  }, [ready, isAuthenticated, profile?.role]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-transparent bg-white/70 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-slate-900/40">
        <div className="container-app h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/home" className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-xl bg-brand-600 shadow-inner" />
              <span className="text-gray-800 dark:text-slate-100">Ronin's Creed</span>
            </Link>
            <nav className="hidden md:flex items-center">
              <div className="bg-gray-100/80 dark:bg-slate-800/80 rounded-2xl p-1 flex items-center gap-1 shadow-inner">
                {tabs.map((t) => (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    className={({ isActive }) => (
                      `px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700'}`
                    )}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <button aria-label="Toggle dark mode" className="px-2 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800" onClick={toggleDark}>{dark ? 'Light' : 'Dark'}</button>
            {ready && isAuthenticated ? (
              <button className="px-3 py-1.5 rounded-xl text-sm bg-gray-100 dark:bg-slate-800" onClick={() => logout()}>Sign out</button>
            ) : ready ? (
              <>
                <button className="px-2 py-1.5 rounded-lg text-sm text-gray-700 dark:text-slate-200" onClick={() => navigate('/signup', { state: { returnTo: loc.pathname } })}>Sign up</button>
                <button className="px-3 py-1.5 rounded-xl text-sm bg-brand-600 text-white" onClick={() => navigate('/login', { state: { returnTo: loc.pathname } })}>Sign in</button>
              </>
            ) : null}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button aria-label="Toggle dark mode" className="btn-ghost px-2 py-1.5" onClick={toggleDark}>{dark ? 'Light' : 'Dark'}</button>
            {ready && isAuthenticated ? (
              <button className="btn-ghost px-3 py-1.5" onClick={() => logout()}>Sign out</button>
            ) : ready ? (
              <div className="flex items-center gap-2">
                <button className="btn-ghost px-3 py-1.5" onClick={() => navigate('/signup', { state: { returnTo: loc.pathname } })}>Sign up</button>
                <button className="btn-primary px-3 py-1.5" onClick={() => navigate('/login', { state: { returnTo: loc.pathname } })}>Sign in</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="container-app py-6 pb-28 md:pb-6">
        {ready && isAuthenticated && user?.emailVerified === false && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 p-3 flex items-center justify-between">
            <div className="text-sm">Please verify your email to secure your account.</div>
            <button
              className="px-3 py-1.5 rounded-md text-sm bg-amber-600 text-white hover:bg-amber-700"
              onClick={async () => {
                try { await api.post('/api/auth/email/request-verify', {}); toast.success('Verification email sent'); }
                catch (e: any) { toast.error(e?.message || 'Failed to send'); }
              }}
            >Resend verification</button>
          </div>
        )}
        {children}
      </main>
      <nav className="fixed bottom-0 inset-x-0 md:hidden z-50">
        <div className="mx-auto max-w-none px-0 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around py-2 text-xs border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} className={({ isActive }) => `px-3 py-2 rounded flex flex-col items-center gap-1 ${isActive ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-slate-400'}`}>
                <t.icon className="h-5 w-5" />
                <span>{t.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}


