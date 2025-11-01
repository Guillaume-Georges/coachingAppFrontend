import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../api';

export default function MembersLeaderboardPage() {
  const api = useApi();
  const [leagueId, setLeague] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; meta: { page: number; limit: number; total: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<any>(`/leaderboard/members?leagueId=${leagueId}&page=${page}&limit=10`).then((res) => setData(res)).finally(() => setLoading(false));
  }, [leagueId, page]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Members Leaderboard</h1>
      <div className="flex items-center gap-2">
        <select className="rounded-lg border-gray-300 text-sm pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" value={leagueId} onChange={(e)=>{setLeague(e.target.value); setPage(1);}}>
          <option value="all">All leagues</option>
          <option value="1">Bronze</option>
          <option value="2">Silver</option>
          <option value="3">Gold</option>
        </select>
      </div>
      <div className="card"><div className="card-body">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-600"><tr><th className="py-1 pr-4">#</th><th className="py-1 pr-4">Member</th><th className="py-1 pr-4">Weekly Points</th><th className="py-1 pr-4">Streak</th><th className="py-1 pr-4">Rank</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-4 text-gray-500">Loading…</td></tr>}
            {data?.items.map((m, i) => (
              <tr key={m.id} className="border-t">
                <td className="py-1 pr-4">{(data.meta.page - 1) * data.meta.limit + i + 1}</td>
                <td className="py-1 pr-4">{m.name}</td>
                <td className="py-1 pr-4">{m.weeklyPoints}</td>
                <td className="py-1 pr-4">{m.streak}</td>
                <td className="py-1 pr-4">{m.rank}</td>
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
