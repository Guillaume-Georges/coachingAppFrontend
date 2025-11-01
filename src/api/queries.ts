import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '.';
import { ProgramCard, ProgramDetail, SessionPayload } from './models';

export function useProgramsQuery(params: URLSearchParams) {
  const api = useApi();
  return useQuery({
    queryKey: ['programs', Object.fromEntries(params)],
    queryFn: async () => {
      const res = await api.get<any>(`/programs?${params.toString()}`);
      const list = z.array(ProgramCard).parse(res.items ?? res);
      const meta = res.meta ?? undefined;
      return { list, meta } as { list: z.infer<typeof ProgramCard>[]; meta?: { page: number; limit: number; total: number } };
    },
  });
}

export function useProgramDetail(id: number) {
  const api = useApi();
  return useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const data = await api.get<unknown>(`/programs/${id}`);
      return ProgramDetail.parse(data);
    },
  });
}

export function useEnroll() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: number) => api.post(`/enrollments`, { programId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment:active'] });
      qc.invalidateQueries({ queryKey: ['workouts:list'] });
    },
  });
}

export function useWorkoutsRange(from: string, to: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['workouts:list', from, to],
    queryFn: () => api.get(`/workouts?from=${from}&to=${to}`),
  });
}

export function useSession(workoutId: number) {
  const api = useApi();
  return useQuery({
    queryKey: ['session', workoutId],
    queryFn: async () => {
      const data = await api.get<unknown>(`/sessions/${workoutId}`);
      return SessionPayload.parse(data);
    },
  });
}

export function useLogSession(workoutId: number) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      sets: { setNum: number; exerciseId?: number; reps?: number; weightKg?: number; distanceM?: number; timeSec?: number }[];
      rpe?: number; durationMin?: number; notes?: string;
    }) => api.post(`/sessions/${workoutId}/log`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', workoutId] });
      qc.invalidateQueries({ queryKey: ['leaderboard:members'] });
    },
  });
}
