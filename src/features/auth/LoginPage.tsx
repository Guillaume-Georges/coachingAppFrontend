import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const loc = useLocation() as any;
  const returnTo = loc?.state?.returnTo || '/home';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await login(email, password);
      // Always land on Home after sign-in
      nav('/home', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            placeholder="member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {/* Mobile-first layout: full-width primary, subtle secondary links */}
        <div className="space-y-3">
          <button type="submit" className="btn-primary w-full py-2.5 rounded-xl" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          <div className="text-sm flex items-center justify-between">
            <a href="/signup" className="text-gray-700 hover:underline dark:text-slate-200">Create an account</a>
            <a href="/forgot-password" className="text-gray-700 hover:underline dark:text-slate-200">Forgot password?</a>
          </div>
        </div>
      </form>
    </div>
  );
}
