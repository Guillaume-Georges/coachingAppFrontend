import { useAuth } from '../../auth/AuthProvider';
import { useUserProfile } from './useUserProfile';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api';
import { UploadImageButton } from '../../components/UploadImageButton';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { logout, isAuthenticated, user } = useAuth() as any;
  const { data: profile } = useUserProfile();
  const api = useApi();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {!isAuthenticated ? (
        <div className="card p-6 text-gray-600">Please sign in to view your profile.</div>
      ) : (
        <div className="card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              {(avatarUrl || (profile as any)?.avatarUrl) ? (
                <img src={(avatarUrl || (profile as any)?.avatarUrl) as string} alt="avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow" />
              ) : (
                <div className="h-16 w-16 rounded-full ring-2 ring-white shadow bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500">?
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                <UploadImageButton signaturePath="/api/uploads/signature/profile" variant="icon" label={saving ? 'Saving…' : 'Upload avatar'} onUploaded={async (url) => {
                  setAvatarUrl(url);
                  setSaving(true);
                  try { await api.put('/api/me', { avatarUrl: url }); } finally { setSaving(false); }
                }} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm text-slate-500">Email</div>
              <div className="break-words break-all sm:break-normal text-gray-900 dark:text-slate-100">{(profile as any)?.email || '—'}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Name</div>
            <input className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" defaultValue={profile?.name || ''} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Role</div>
            <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-sm">{profile?.role}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary px-3 py-2 rounded-xl" disabled={saving} onClick={async ()=>{
              setSaving(true);
              await api.put('/api/me', { name: name || profile?.name, avatarUrl });
              await qc.invalidateQueries({ queryKey: ['user:profile'] });
              setSaving(false);
              try { toast.success('Profile updated'); } catch {}
            }}>Save changes</button>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Security</h2>
              <p className="text-xs text-slate-500 mt-1">Send a password reset link to your email.</p>
              <button
                className="mt-2 inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:bg-slate-900"
                onClick={async ()=>{ try { await api.post('/api/auth/password/request', { email: user?.email }); alert('If that email exists, we sent a link.'); } catch { alert('If that email exists, we sent a link.'); } }}
              >
                Reset password
              </button>
            </div>
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Danger zone</h3>
              <p className="text-xs text-red-700/90 dark:text-red-300/90 mt-1">Permanently delete your account and all associated data.</p>
              <button className="mt-2 inline-flex items-center px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={async ()=>{ if (confirm('Delete your account? This cannot be undone.')) { await api.del('/api/me'); await logout(); } }}>Delete account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
