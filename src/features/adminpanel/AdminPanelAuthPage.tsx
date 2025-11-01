import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminPanelAuthPage() {
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="inline-flex rounded-xl p-1 bg-gray-100 dark:bg-slate-800 mb-4">
        <button className={`px-4 py-2 rounded-lg text-sm ${mode==='signin'?'bg-brand-600 text-white':''}`} onClick={()=>setMode('signin')}>Sign in</button>
        <button className={`px-4 py-2 rounded-lg text-sm ${mode==='signup'?'bg-brand-600 text-white':''}`} onClick={()=>setMode('signup')}>Sign up</button>
      </div>
      {mode==='signin' ? <AdminSignIn /> : <AdminSignUp />}
    </div>
  );
}

function AdminSignIn() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const returnTo = loc?.state?.returnTo || '/admin';
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(undefined); setLoading(true);
    try { await login(email, password); nav(returnTo, { replace: true }); } catch (err: any) { setError(err?.message||'Sign in failed'); } finally { setLoading(false); }
  }
  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input className="mt-1 w-full rounded-lg border-gray-300" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input className="mt-1 w-full rounded-lg border-gray-300" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex items-center justify-end">
        <button className="btn-primary px-4 py-2 rounded-xl" disabled={loading}>{loading?'Signing in…':'Sign in'}</button>
      </div>
    </form>
  );
}

function AdminSignUp() {
  const { register, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const returnTo = loc?.state?.returnTo || '/admin';
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(undefined); setLoading(true);
    try {
      await register({ email, password, role: 'admin', adminSecret });
      await login(email, password);
      nav(returnTo, { replace: true });
    } catch (err: any) { setError(err?.message||'Sign up failed'); } finally { setLoading(false); }
  }
  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <p className="text-sm text-gray-600 dark:text-slate-300">Provide the admin signup secret to create an admin account.</p>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input className="mt-1 w-full rounded-lg border-gray-300" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input className="mt-1 w-full rounded-lg border-gray-300" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Admin Secret</label>
        <input className="mt-1 w-full rounded-lg border-gray-300" type="password" value={adminSecret} onChange={e=>setAdminSecret(e.target.value)} placeholder="Provided by system admin" required />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex items-center justify-end">
        <button className="btn-primary px-4 py-2 rounded-xl" disabled={loading}>{loading?'Creating…':'Create admin'}</button>
      </div>
    </form>
  );
}

