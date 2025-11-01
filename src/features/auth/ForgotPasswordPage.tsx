import { useState } from 'react';
import { useApi } from '../../api';

export default function ForgotPasswordPage() {
  const api = useApi();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await api.post('/api/auth/password/request', { email }); }
    catch {}
    finally { setLoading(false); setSubmitted(true); }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <div className="card p-6 text-sm text-gray-700 dark:text-slate-200">
          If that email exists, we sent a password reset link. The link is valid for a limited time.
        </div>
        <a href="/login" className="text-sm text-gray-700 dark:text-slate-200 hover:underline">Back to sign in</a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Forgot password</h1>
      <form onSubmit={onSubmit} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" placeholder="member@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div className="flex items-center justify-between">
          <a href="/login" className="text-sm text-gray-700 hover:underline">Back to sign in</a>
          <button className="btn-primary px-4 py-2 rounded-xl" disabled={loading}>{loading ? 'Submitting...' : 'Send reset link'}</button>
        </div>
      </form>
    </div>
  );
}
