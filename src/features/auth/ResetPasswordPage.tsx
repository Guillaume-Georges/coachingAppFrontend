import { useEffect, useState } from 'react';
import { useApi } from '../../api';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const api = useApi();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const code = params.get('code') || '';
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!code) { setValid(false); return; }
      try {
        const res = await api.get<{ valid: boolean; expiresAt?: string }>(`/api/auth/password/verify?code=${encodeURIComponent(code)}`);
        if (!ignore) setValid(res?.valid ?? true);
      } catch {
        if (!ignore) setValid(true); // allow proceed if endpoint not available
      }
    })();
    return () => { ignore = true; };
  }, [code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/password/complete', { code, newPassword: password });
      navigate('/login', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Reset failed. The link may be expired.');
    } finally { setLoading(false); }
  }

  if (!code) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Reset link invalid</h1>
        <div className="card p-6 text-sm">Missing code. Request a new reset link.</div>
        <a href="/forgot-password" className="text-sm text-gray-700 hover:underline">Request reset</a>
      </div>
    );
  }

  if (valid === false) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Reset link expired</h1>
        <div className="card p-6 text-sm">Your reset link is invalid or expired. You can request a new one.</div>
        <a href="/forgot-password" className="text-sm text-gray-700 hover:underline">Request reset</a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Set a new password</h1>
      <form onSubmit={onSubmit} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <p className="text-xs text-gray-500 mt-1">Min 8 chars incl. upper, lower, number, symbol</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Confirm password</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-between">
          <a href="/login" className="text-sm text-gray-700 hover:underline">Back to sign in</a>
          <button className="btn-primary px-4 py-2 rounded-xl" disabled={loading}>{loading ? 'Saving...' : 'Update password'}</button>
        </div>
      </form>
    </div>
  );
}
