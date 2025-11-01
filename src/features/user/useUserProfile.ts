import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api';
import { useAuth } from '../../auth/AuthProvider';

export type UserProfile = { id: string; name?: string; role: 'member'|'coach'|'superadmin'|'admin' };

export function useUserProfile() {
  const api = useApi();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['user:profile'],
    queryFn: async () => {
      const data = await api.get<{ id: string; name?: string; role: UserProfile['role'] }>(`/api/me`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
  });
}
