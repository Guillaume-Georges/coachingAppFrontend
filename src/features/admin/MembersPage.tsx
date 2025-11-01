import { useMemo, useState } from 'react';
import { useAdminMembers } from './membersApi';

export default function MembersPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member'|'admin'>('member');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { list, invite, resetPassword, changeRole, remove, isLoading } = useAdminMembers(search, page, limit);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((list.data?.total || 0) / (list.data?.limit || limit))), [list.data, limit]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-2 mb-4">
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by email or name" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
          <select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }} className="rounded-xl border border-gray-300 px-3 py-2 pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
            {[10,20,50].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
          <button className="btn-ghost px-3 py-2" onClick={()=>{ setPage(1); list.refetch(); }}>Search</button>
        </div>
        <h2 className="text-sm font-semibold mb-2">Invite user</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,140px,140px,140px,auto] gap-2">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name (optional)" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Set password" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
          <select value={role} onChange={(e)=>setRole(e.target.value as any)} className="rounded-xl border border-gray-300 px-3 py-2 pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary px-4 py-2 rounded-xl" onClick={() => {
            if(!email) return;
            invite.mutate({ email, role, password: password || undefined, name: name || undefined }, { onSuccess: () => { setEmail(''); setPassword(''); setName(''); } });
          }}>Send invite</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">All users</h2>
            {list.isFetching && <span className="text-xs text-gray-500">Refreshing…</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr><th className="py-1 pr-4">Email</th><th className="py-1 pr-4">Name</th><th className="py-1 pr-4">Role</th><th className="py-1 pr-4">Created</th><th className="py-1 pr-4"/></tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={4} className="py-6 text-center text-gray-500">Loading…</td></tr>}
                {list.data?.items?.map((u: any) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-700" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-slate-100 truncate">{u.email}</div>
                          <div className="text-xs text-gray-500 truncate">{u.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-4">{u.name || '—'}</td>
                    <td className="py-2 pr-4">
                      <select disabled={u.role === 'superadmin'} value={u.role} onChange={(e)=> changeRole.mutate({ id: u.id, role: e.target.value as any })} className="rounded-lg border border-gray-300 px-2 py-1 pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                        {u.role === 'superadmin' && <option value="superadmin">superadmin</option>}
                      </select>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      <button className="btn-ghost px-2" onClick={() => resetPassword.mutate(u.id)}>Reset password</button>
                      <button className="btn-ghost px-2 text-red-600" onClick={() => { if (confirm('Delete this user?')) remove.mutate(u.id); }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm">
              <div className="text-gray-500">Page {list.data?.page || page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost px-2" disabled={(list.data?.page || page) <= 1} onClick={()=> setPage(p => Math.max(1, p-1))}>‹ Prev</button>
                <button className="btn-ghost px-2" disabled={(list.data?.page || page) >= totalPages} onClick={()=> setPage(p => Math.min(totalPages, p+1))}>Next ›</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
