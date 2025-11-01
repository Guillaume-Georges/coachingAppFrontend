import { createApi } from './client';
import { useAuth } from '../auth/AuthProvider';

export function useApi() {
  const { getToken } = useAuth();
  return createApi(() => getToken());
}
