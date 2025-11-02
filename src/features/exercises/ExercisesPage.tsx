import { useEffect, useMemo, useState } from 'react';
import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';
import { useExercisesQuery } from './api';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ExerciseCard } from './components/ExerciseCard';
import { Paginator } from './components/Paginator';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { useUserProfile } from '../user/useUserProfile';
import { useAuth } from '../../auth/AuthProvider';
import { AdminFormExercise } from './admin/AdminFormExercise';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api';
import { Exercise } from './types';
import { z } from 'zod';

export default function ExercisesPage() {
  const [params, setParams] = useSearchParams(new URLSearchParams({ page: '1', limit: '24' }));
  const { data, isLoading, isFetching } = useExercisesQuery(params);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const { data: profile } = useUserProfile();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const api = useApi();
  const isDetailFetching = useIsFetching({ queryKey: ['exercise', editItem?.id], exact: true }) > 0;
  const page = Number(params.get('page') || 1);
  const limit = Number(params.get('limit') || 24);

  useEffect(() => {
    if (!params.get('page')) { const p = new URLSearchParams(params); p.set('page','1'); setParams(p, { replace: true }); }
  }, []);

  const list = data?.items || [];

  const isAdmin = !!isAuthenticated && (profile?.role === 'admin' || profile?.role === 'superadmin');

  const activeFilters = useMemo(() => {
    const ignored = new Set(['page','limit','search']);
    let count = 0; params.forEach((_, k) => { if (!ignored.has(k)) count++; });
    return count;
  }, [params]);

  const hasFilters = activeFilters > 0;

  // Prefetch details for the first few items to speed up navigation to detail pages
  useEffect(() => {
    const items = data?.items || [];
    const prefetchCount = 8; // prefetch top N
    items.slice(0, prefetchCount).forEach((it) => {
      if (!it?.id) return;
      qc.prefetchQuery({
        queryKey: ['exercise', it.id],
        queryFn: async () => {
          const res = await api.get<unknown>(`/api/exercises/${it.id}`);
          return Exercise.parse(res);
        },
        staleTime: 1000 * 60 * 5,
      }).catch(() => {});
    });
  }, [data?.items, qc, api]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Exercise Library</h1>
            {!!data && isFetching && <Spinner size={18} className="text-brand-600" />}
          </div>
          <div className="flex items-center gap-2">
            <button className={`inline-flex items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl border ${hasFilters
              ? 'border-brand-600 text-brand-700 bg-brand-50 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-700 dark:text-white dark:hover:bg-brand-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-800'
            }`} onClick={() => setOpen(true)}>
              <FunnelIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Filters{hasFilters ? ` (${activeFilters})` : ''}</span>
            </button>
          </div>
        </div>
        {/* Mobile actions removed: Filter icon is next to title */}
        <SearchBar />
        <div className="mt-4 border-t border-gray-200 dark:border-slate-800" />
        {isLoading ? (
          <ul className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="card p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">{(data?.total ?? list.length)} results</div>
            {list.length === 0 ? (
              <div className="mt-10 text-center text-gray-600">No exercises match your filters.</div>
            ) : (
              <ul className="mt-6 space-y-4" role="list">
                {list.map((it) => (
                  <ExerciseCard
                    key={it.id}
                    item={it}
                    onEdit={isAdmin ? (itm) => setEditItem(itm) : undefined}
                    onHover={() => {
                      if (!it?.id) return;
                      qc.prefetchQuery({
                        queryKey: ['exercise', it.id],
                        queryFn: async () => {
                          const res = await api.get<unknown>(`/api/exercises/${it.id}`);
                          return Exercise.parse(res);
                        },
                        staleTime: 1000 * 60 * 5,
                      }).catch(() => {});
                    }}
                  />
                ))}
              </ul>
            )}
          </>
        )}
        {data && (
          <div className="mt-8">
            <Paginator page={data.page || page} limit={data.limit || limit} total={data.total || list.length} />
          </div>
        )}
        {isAdmin && (
          <div className="mt-6 flex items-center justify-center">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white shadow-sm hover:brightness-110" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-5 w-5" />
              <span>New Exercise</span>
            </button>
          </div>
        )}
      </div>
      {/* Single dynamic filter panel; remove duplicate static panel on desktop */}
      <FilterPanel open={open} onClose={() => setOpen(false)} />
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl shadow-xl w-full max-w-3xl px-6 pt-6 pb-0 h-[100vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 select-text">Create Exercise</h2>
            <AdminFormExercise onClose={() => setCreateOpen(false)} />
          </div>
        </div>
      )}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl shadow-xl w-full max-w-3xl px-6 pt-6 pb-0 h-[100vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold select-text">Edit Exercise</h2>
              {isDetailFetching && <Spinner size={18} className="text-brand-600" />}
            </div>
            <AdminFormExercise initial={editItem} onClose={() => setEditItem(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
