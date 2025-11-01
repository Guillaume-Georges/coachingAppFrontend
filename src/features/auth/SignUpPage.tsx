import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SignUpPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const loc = useLocation() as any;
  const returnTo = loc?.state?.returnTo || '/home';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ email, password, name, role: 'member' });
      nav('/verify-email/sent', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Sign up failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input type="text" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" placeholder="Alex Strong" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" placeholder="member@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="text-xs text-gray-500 mt-1">Min 8 chars incl. upper, lower, number, symbol</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Confirm Password</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {/* Mobile-first layout: full-width primary button, link below */}
        <div className="space-y-3">
          <button type="submit" className="btn-primary w-full py-2.5 rounded-xl" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          <div className="text-sm text-center">
            Already have an account? <a className="text-brand-700 hover:underline dark:text-brand-400" href="/login">Sign in</a>
          </div>
        </div>
      </form>
    </div>
  );
}
