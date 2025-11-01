import { useEffect, useState } from 'react';
import { useApi } from '../../api';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VerifyEmailPage() {
  const api = useApi();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const code = params.get('code') || '';
  const [status, setStatus] = useState<'pending'|'ok'|'error'>('pending');
  const [message, setMessage] = useState<string>('Verifying your email...');

  useEffect(() => {
    (async () => {
      if (!code) { setStatus('error'); setMessage('Missing verification code.'); return; }
      try {
        const res = await api.post<{ verified: boolean }>(`/api/auth/email/verify`, { code });
        if (res?.verified) { setStatus('ok'); setMessage('Your email has been verified.'); }
        else { setStatus('error'); setMessage('Verification failed.'); }
      } catch (e: any) {
        setStatus('error'); setMessage(e?.message || 'Verification failed.');
      }
    })();
  }, [code]);

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Verify email</h1>
      <div className="card p-6 text-sm">
        {message}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-primary px-4 py-2 rounded-xl" onClick={() => navigate('/login', { replace: true })}>Go to sign in</button>
      </div>
    </div>
  );
}

