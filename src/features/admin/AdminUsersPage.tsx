import { useEffect, useState } from 'react';
import { useApi } from '../../api';

export default function AdminUsersPage() {
  const api = useApi();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{ items: any[]; meta: any } | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const res = await api.get<any>(`/admin/users?query=${encodeURIComponent(query)}`);
    setData(res);
    setLoading(false);
  }

  useEffect(() => { search(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin • Users</h1>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium">Search</label>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full rounded-lg border p-2 text-sm" />
        </div>
        <button className="btn-ghost px-3 py-2" onClick={search}>Search</button>
      </div>
      <div className="card"><div className="card-body">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-600"><tr><th className="py-1 pr-4">Email</th><th className="py-1 pr-4">Role</th><th className="py-1 pr-4">Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="py-4">Loading…</td></tr>}
            {data?.items.map(u => (
              <tr key={u.id} className="border-t">
                <td className="py-1 pr-4">{u.email}</td>
                <td className="py-1 pr-4">{u.role}</td>
                <td className="py-1 pr-4 text-gray-400">Promote • Demote • Freeze</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
