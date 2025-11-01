import { useEffect, useState } from 'react';
import { useApi } from '../../api';

export default function CoachesLeaderboardPage() {
  const api = useApi();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; meta: { page: number; limit: number; total: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<any>(`/leaderboard/coaches?page=${page}&limit=10`).then((res) => setData(res)).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Coaches Leaderboard</h1>
      <div className="card"><div className="card-body">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-600"><tr><th className="py-1 pr-4">#</th><th className="py-1 pr-4">Coach</th><th className="py-1 pr-4">Weekly Score</th><th className="py-1 pr-4">Active Members</th><th className="py-1 pr-4">Trend</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-4 text-gray-500">Loading…</td></tr>}
            {data?.items.map((m, i) => (
              <tr key={m.id} className="border-t">
                <td className="py-1 pr-4">{(data.meta.page - 1) * data.meta.limit + i + 1}</td>
                <td className="py-1 pr-4">{m.name}</td>
                <td className="py-1 pr-4">{m.weeklyScore}</td>
                <td className="py-1 pr-4">{m.activeMembers}</td>
                <td className="py-1 pr-4">{m.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="flex items-center gap-2 justify-end pt-3">
            <button className="btn-ghost px-3 py-1.5" disabled={data.meta.page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <span className="text-sm">Page {data.meta.page} / {Math.max(1, Math.ceil(data.meta.total / data.meta.limit))}</span>
            <button className="btn-ghost px-3 py-1.5" disabled={data.meta.page>=Math.ceil(data.meta.total / data.meta.limit)} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        )}
      </div></div>
    </div>
  );
}

