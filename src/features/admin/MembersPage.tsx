import React, { useMemo, useRef, useState } from 'react';
import { useAdminMembers } from './membersApi';
import { MagnifyingGlassIcon, XMarkIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';

export default function MembersPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member'|'admin'>('member');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [showInvite, setShowInvite] = useState(false);
  const inviteRef = useRef<HTMLDivElement>(null);

  const { list, invite, resetPassword, changeRole, remove, isLoading } = useAdminMembers(search, page, limit);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((list.data?.total || 0) / (list.data?.limit || limit))), [list.data, limit]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  function openInvite() {
    // Open inline without changing scroll position
    setShowInvite(true);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>
        <button onClick={openInvite} className="btn-primary px-3 py-1.5 rounded-xl text-sm">Invite users</button>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="mb-2">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e)=>{ setSearchInput(e.target.value); setPage(1); }}
              placeholder="Search by email or name"
              className="w-full rounded-xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-brand-600 focus:ring-brand-600 pl-10 pr-9 py-1.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" aria-hidden />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={()=>{ setSearchInput(''); setPage(1); }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {showInvite && (
          <div ref={inviteRef} id="invite">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Invite user</h2>
              <button className="btn-ghost px-2 py-1 text-sm" onClick={() => setShowInvite(false)}>Hide</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,140px,140px,140px,auto] gap-2">
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
              <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name (optional)" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Set password (optional)" className="rounded-xl border border-gray-300 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
              <select value={role} onChange={(e)=>setRole(e.target.value as any)} className="rounded-xl border border-gray-300 px-3 py-2 pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="btn-primary px-4 py-2 rounded-xl"
                onClick={() => {
                  if(!email) { toast.error('Email is required'); return; }
                  invite.mutate(
                    { email, role, password: password || undefined, name: name || undefined },
                    { onSuccess: () => { setEmail(''); setPassword(''); setName(''); } }
                  );
                }}
              >Send invite</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">All users</h2>
            {(isLoading || list.isFetching) && <Spinner size={18} className="text-brand-600" />}
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y">
            {/* no blocking loading row; show spinner in header instead */}
            {!isLoading && (list.data?.items?.length ?? 0) === 0 && (
              <div className="py-6 text-center text-gray-500">No members found</div>
            )}
            {list.data?.items?.map((u: any) => (
              <div key={u.id} className="py-3 flex items-start gap-3">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-700" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-slate-100 truncate">{u.name || u.email}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      disabled={u.role === 'superadmin'}
                      value={u.role}
                      onChange={(e)=> changeRole.mutate({ id: u.id, role: e.target.value as any })}
                      className="rounded-lg border border-gray-300 px-2 py-1 pr-8 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                      {u.role === 'superadmin' && <option value="superadmin">superadmin</option>}
                    </select>
                    <span className="text-xs text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button aria-label="Actions" className="btn-ghost p-2 rounded-md">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </Menu.Button>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-slate-900 shadow ring-1 ring-black/5 focus:outline-none">
                      <div className="py-1 text-sm">
                        <Menu.Item>
                          {({ active }) => (
                            <button className={(active ? 'bg-gray-100 dark:bg-slate-800 ' : '') + 'block w-full text-left px-3 py-1.5'} onClick={() => resetPassword.mutate(u.id)}>
                              Reset password
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button className={(active ? 'bg-gray-100 dark:bg-slate-800 ' : '') + 'block w-full text-left px-3 py-1.5 text-red-600'} onClick={() => { if (confirm('Delete this user?')) remove.mutate(u.id); }}>
                              Delete user
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr><th className="py-1 pr-4">Email</th><th className="py-1 pr-4">Name</th><th className="py-1 pr-4">Role</th><th className="py-1 pr-4">Created</th><th className="py-1 pr-4"/></tr>
              </thead>
              <tbody>
                {!isLoading && (list.data?.items?.length ?? 0) === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-500">No members found</td></tr>
                )}
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
                          <div className="font-medium text-gray-900 dark:text-slate-100 truncate">{u.name || u.email}</div>
                          <div className="text-xs text-gray-500 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-4">{u.name || '-'}</td>
                    <td className="py-2 pr-4">
                      <select disabled={u.role === 'superadmin'} value={u.role} onChange={(e)=> changeRole.mutate({ id: u.id, role: e.target.value as any })} className="rounded-lg border border-gray-300 px-2 py-1 pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                        {u.role === 'superadmin' && <option value="superadmin">superadmin</option>}
                      </select>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button aria-label="Actions" className="btn-ghost p-2 rounded-md">
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </Menu.Button>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-slate-900 shadow ring-1 ring-black/5 focus:outline-none">
                            <div className="py-1 text-sm">
                              <Menu.Item>
                                {({ active }) => (
                                  <button className={(active ? 'bg-gray-100 dark:bg-slate-800 ' : '') + 'block w-full text-left px-3 py-1.5'} onClick={() => resetPassword.mutate(u.id)}>
                                    Reset password
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button className={(active ? 'bg-gray-100 dark:bg-slate-800 ' : '') + 'block w-full text-left px-3 py-1.5 text-red-600'} onClick={() => { if (confirm('Delete this user?')) remove.mutate(u.id); }}>
                                    Delete user
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="text-gray-500">Page {list.data?.page || page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost px-2" disabled={(list.data?.page || page) <= 1} onClick={()=> setPage(p => Math.max(1, p-1))}>Prev</button>
              <button className="btn-ghost px-2" disabled={(list.data?.page || page) >= totalPages} onClick={()=> setPage(p => Math.min(totalPages, p+1))}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
