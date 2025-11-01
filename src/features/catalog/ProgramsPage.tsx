import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProgramsQuery } from '../../api/queries';
import { Skeleton } from '../../components/ui/Skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api';
import { z } from 'zod';
import { ProgramDetail } from '../../api/models';

export default function ProgramsPage() {
  const [params, setParams] = useSearchParams();
  const queryParams = useMemo(() => new URLSearchParams(params), [params]);
  const { data, isLoading } = useProgramsQuery(queryParams);
  const qc = useQueryClient();
  const api = useApi();

  function onFilterChange(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={params.get('goal') ?? ''}
          onChange={(e) => onFilterChange('goal', e.target.value)}
          className="rounded-lg border-gray-300 text-sm"
        >
          <option value="">All goals</option>
          <option value="muscle">Muscle</option>
          <option value="fat_loss">Fat loss</option>
          <option value="performance">Performance</option>
        </select>
        <select
          value={params.get('level') ?? ''}
          onChange={(e) => onFilterChange('level', e.target.value)}
          className="rounded-lg border-gray-300 text-sm"
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card"><div className="card-body"><Skeleton className="h-40" /></div></div>
        ))}
        {data?.list.map((p) => (
          <Link
            key={p.id}
            to={`/programs/${p.id}`}
            className="card group"
            onMouseEnter={() => qc.prefetchQuery({ queryKey: ['program', p.id], queryFn: async () => {
              const d = await api.get<unknown>(`/programs/${p.id}`);
              return ProgramDetail.parse((d as any));
            }})}
          >
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-700">{p.title}</h3>
                {p.coach.league && (
                  <span className="badge" style={{ borderColor: p.coach.league.color, color: p.coach.league.color }}>{p.coach.league.name}</span>
                )}
              </div>
              <div className="text-sm text-gray-600">Coach: {p.coach.name}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="badge-info">{p.level}</span>
                <span className="badge-warning">{p.goal}</span>
                <span className="badge-success">{p.durationWeeks} weeks</span>
              </div>
              <div className="text-xs text-gray-500">Adherence: {p.metrics.avgAdherence ?? '—'} • Progress Δ: {p.metrics.avgProgressDelta ?? '—'}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data?.meta && (
        <div className="flex items-center gap-2 justify-end">
          <button className="btn-ghost px-3 py-1.5" disabled={(data.meta.page ?? 1) <= 1} onClick={() => onFilterChange('page', String((data.meta.page ?? 1) - 1))}>Prev</button>
          <span className="text-sm">Page {data.meta.page} / {Math.max(1, Math.ceil(data.meta.total / data.meta.limit))}</span>
          <button className="btn-ghost px-3 py-1.5" disabled={(data.meta.page ?? 1) >= Math.ceil(data.meta.total / data.meta.limit)} onClick={() => onFilterChange('page', String((data.meta.page ?? 1) + 1))}>Next</button>
        </div>
      )}
    </div>
  );
}
