import { useAuth } from '../../auth/AuthProvider';
import { useUserProfile } from './useUserProfile';
import { useState } from 'react';
import { useApi } from '../../api';
import { UploadImageButton } from '../../components/UploadImageButton';

export default function ProfilePage() {
  const { logout, isAuthenticated } = useAuth();
  const { data: profile } = useUserProfile();
  const api = useApi();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {!isAuthenticated ? (
        <div className="card p-6 text-gray-600">Please sign in to view your profile.</div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {(avatarUrl || (profile as any)?.avatarUrl) ? (
                <img src={(avatarUrl || (profile as any)?.avatarUrl) as string} alt="avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow" />
              ) : (
                <div className="h-16 w-16 rounded-full ring-2 ring-white shadow bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500">?
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                <UploadImageButton variant="icon" label={saving ? 'Saving…' : 'Upload avatar'} onUploaded={async (url) => {
                  setAvatarUrl(url);
                  setSaving(true);
                  try { await api.put('/api/me', { avatarUrl: url }); } finally { setSaving(false); }
                }} />
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Email</div>
              <div>{(profile as any)?.email || '—'}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">User ID</div>
            <div className="font-mono text-sm break-all">{profile?.id}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Name</div>
            <input className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" defaultValue={profile?.name || ''} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Role</div>
            <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-sm">{profile?.role}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn-primary px-3 py-2 rounded-xl" disabled={saving} onClick={async ()=>{
              setSaving(true);
              await api.put('/api/me', { name: name || profile?.name, avatarUrl });
              setSaving(false);
              window.location.reload();
            }}>Save</button>
            <button className="btn-ghost px-3 py-2" onClick={async ()=>{ await api.post('/api/auth/reset-password', {}); alert('Reset email sent'); }}>Reset password</button>
            <button className="btn-ghost px-3 py-2 text-red-600" onClick={async ()=>{ if (confirm('Delete your account?')) { await api.del('/api/me'); await logout(); } }}>Delete account</button>
          </div>
          <div className="pt-2">
            <button className="btn-ghost px-3 py-2" onClick={() => logout()}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}
