import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWorkoutsRange } from '../../api/queries';

export default function PlanPage() {
  const today = new Date();
  const from = new Date(today); from.setDate(today.getDate() - 7);
  const to = new Date(today); to.setDate(today.getDate() + 21);
  const fromStr = from.toISOString().slice(0,10);
  const toStr = to.toISOString().slice(0,10);
  const { data, isLoading } = useWorkoutsRange(fromStr, toStr);

  const items = useMemo(() => (data as any[] ?? []).map((w: any) => ({
    id: w.id,
    date: w.plannedFor,
    title: w.title,
    objective: w.objective,
    status: w.status as 'planned'|'done'|'skipped',
  })), [data]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Your Plan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card"><div className="card-body"><div className="h-24 bg-gray-200 animate-pulse rounded" /></div></div>
        ))}
        {items.map(w => (
          <Link key={w.id} to={`/workout/${w.id}`} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="text-sm text-gray-500">{new Date(w.date).toDateString()}</div>
              <div className="font-medium">{w.title}</div>
              <div className="text-sm text-gray-600">{w.objective}</div>
              <div className="mt-2">
                <span className={`badge ${w.status==='done'?'badge-success':w.status==='skipped'?'badge-warning':'badge-info'}`}>{w.status}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
