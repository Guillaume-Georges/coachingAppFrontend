import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api';

export function useAdminMembers(search = '', page = 1, limit = 20) {
  const api = useApi();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['admin:users', { search, page, limit }],
    queryFn: () => api.get<{ items: any[]; page: number; limit: number; total: number }>(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`),
    keepPreviousData: true,
  });
  const invite = useMutation({
    mutationFn: ({ email, role, password, name }: { email: string; role: 'member'|'admin'; password?: string; name?: string }) => api.post(`/api/admin/users/invite`, { email, role, ...(password ? { password } : {}), ...(name ? { name } : {}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:users'] }),
  });
  const resetPassword = useMutation({
    mutationFn: (userId: string) => api.post(`/api/admin/users/${userId}/reset-password`, {}),
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'member'|'admin' }) => api.patch(`/api/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:users'] }),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => api.del(`/api/admin/users/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:users'] }),
  });
  return { list, invite, resetPassword, changeRole, remove, isLoading: list.isLoading || list.isFetching };
}
