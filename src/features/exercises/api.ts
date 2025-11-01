import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api';
import { Exercise, ExerciseListResponse, FiltersResponse, TExercise, MuscleMapMeta, LeanExercise, LeanExerciseListResponse } from './types';
import { z } from 'zod';
import toast from 'react-hot-toast';

export function useExercisesQuery(search: URLSearchParams) {
  const api = useApi();
  const qc = useQueryClient();
  // add light "fields" hint to backend for lean responses (ignored by mocks)
  const s = new URLSearchParams(search);
  if (!s.get('fields')) s.set('fields', 'id,name,thumbnailUrl,modality,bodyPartFocus,tags,musclesPrimaryCodes,musclesSecondaryCodes');
  const key = ['exercises', Object.fromEntries(s)];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const data = await api.get<any>(`/api/exercises?${s.toString()}`);
      // Support both wrapped and raw responses, lean and full
      const full = ExerciseListResponse.safeParse(data);
      if (full.success) return full.data;
      const lean = LeanExerciseListResponse.safeParse(data);
      if (lean.success) return lean.data as any;
      // If not in the canonical shape, parse items directly
      const itemsRaw = (data as any).items ?? data;
      let items: any[];
      try { items = z.array(Exercise).parse(itemsRaw); }
      catch { items = z.array(LeanExercise).parse(itemsRaw); }
      const page = Number((data as any).page ?? s.get('page') ?? 1);
      const limit = Number((data as any).limit ?? s.get('limit') ?? 24);
      const total = Number((data as any).total ?? items.length);
      return { items, page, limit, total };
    },
    staleTime: 1000 * 30,
    keepPreviousData: true,
  });

  // Prefetch next page when we have a full page of results
  const current = Number(s.get('page') || '1');
  const limit = Number(s.get('limit') || '24');
  if ((q.data?.items?.length || 0) === limit) {
    const next = new URLSearchParams(s);
    next.set('page', String(current + 1));
    qc.prefetchQuery({
      queryKey: ['exercises', Object.fromEntries(next)],
      queryFn: async () => {
        const data = await api.get<any>(`/api/exercises?${next.toString()}`);
        const parsed = ExerciseListResponse.safeParse(data);
        if (parsed.success) return parsed.data;
        const items = z.array(Exercise).parse((data as any).items ?? data);
        const page = Number((data as any).page ?? next.get('page') ?? 1);
        const limit2 = Number((data as any).limit ?? next.get('limit') ?? 24);
        const total = Number((data as any).total ?? items.length);
        return { items, page, limit: limit2, total };
      },
      staleTime: 1000 * 30,
    });
  }

  return q;
}

export function useExerciseDetail(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: async () => {
      const data = await api.get<unknown>(`/api/exercises/${id}`);
      return Exercise.parse((data as any));
    },
    enabled: !!id,
  });
}

export function useFilters() {
  const api = useApi();
  return useQuery({
    queryKey: ['exercises:filters'],
    queryFn: async () => {
      const data = await api.get<unknown>('/api/meta/filters');
      return FiltersResponse.parse(data);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMuscleMapMeta() {
  const api = useApi();
  return useQuery({
    queryKey: ['exercises:muscle-map'],
    queryFn: async () => {
      const data = await api.get<unknown>('/api/meta/muscle-map');
      return MuscleMapMeta.parse(data);
    },
    staleTime: 1000 * 60 * 60,
  });
}

// Facet options with counts
type Facet = 'categories'|'tags'|'modalities'|'equipment'|'bodyPartFocus';
type FacetOption = { value: string; count: number };

export function useFacetOptions(facet: Facet, search: string) {
  const api = useApi();
  return useQuery<FacetOption[]>({
    queryKey: ['exercises:facets', facet, search],
    queryFn: async () => {
      const p = new URLSearchParams({ facets: facet, ...(search ? { search } : {}), limit: '20' });
      const data = await api.get<any>(`/api/meta/facets?${p.toString()}`);
      const list = (data?.facets?.[facet] ?? []) as FacetOption[];
      // Fallback to filters without counts if API isn't ready
      if (list.length === 0 && facet !== 'modalities') {
        try {
          const filters = await api.get<any>('/api/meta/filters');
          const arr = (filters?.[facet] ?? []) as string[];
          return arr
            .filter((v) => !search || v.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 20)
            .map((v) => ({ value: v, count: 0 }));
        } catch {}
      }
      return list as FacetOption[];
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateFacet() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facet, value }: { facet: Facet; value: string }) => api.post(`/api/meta/facets`, { facet, value }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['exercises:facets', vars.facet] });
    },
  });
}

export function useAdminExerciseMutations() {
  const api = useApi();
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (payload: Omit<TExercise, 'id'|'createdAt'|'updatedAt'>) => api.post(`/api/exercises`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); toast.success('Exercise created'); },
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TExercise> }) => {
      const touchesMuscles =
        Object.prototype.hasOwnProperty.call(patch, 'musclesPrimaryCodes') ||
        Object.prototype.hasOwnProperty.call(patch, 'musclesSecondaryCodes') ||
        Object.prototype.hasOwnProperty.call(patch, 'musclesPrimary') ||
        Object.prototype.hasOwnProperty.call(patch, 'musclesSecondary');
      if (touchesMuscles) {
        return api.patch(`/api/exercises/${id}?async=1`, patch);
      }
      return api.put(`/api/exercises/${id}`, patch);
    },
    onSuccess: async (data: any, vars) => {
      // If server responded with early success, poll job briefly then refresh
      if (data?.updateAccepted && data?.jobId) {
        const start = Date.now();
        const timeoutMs = 5000;
        let done = false;
        try {
          while (!done && Date.now() - start < timeoutMs) {
            // eslint-disable-next-line no-await-in-loop
            const j = await api.get<any>(`/api/jobs/${data.jobId}`);
            if (j?.status === 'succeeded' || j?.status === 'failed') {
              done = true; break;
            }
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, 400));
          }
        } catch {}
      }
      qc.invalidateQueries({ queryKey: ['exercise', vars.id] });
      qc.invalidateQueries({ queryKey: ['exercises'] });
      toast.success('Exercise updated');
    },
    onError: (err: any) => {
      try {
        const code = err?.code;
        const details = err?.details as any;
        if (err?.status === 422 && details?.invalidMuscles) {
          const p = details.invalidMuscles.primary?.join(', ');
          const s = details.invalidMuscles.secondary?.join(', ');
          const parts = [p ? `primary: ${p}` : '', s ? `secondary: ${s}` : ''].filter(Boolean);
          toast.error(`Invalid muscles: ${parts.join(' • ')}`);
          return;
        }
      } catch {}
      toast.error(err?.message || 'Failed to update exercise');
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.del(`/api/exercises/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); toast.success('Exercise deleted'); },
  });
  return { create, update, del };
}
