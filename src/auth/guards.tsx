import { Navigate } from 'react-router-dom';
import { useUserProfile } from '../features/user/useUserProfile';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ role, children }: { role: 'member'|'coach'|'superadmin'|'admin', children: JSX.Element }) {
  const { data, isLoading } = useUserProfile();
  if (isLoading) return null;
  if (!data) return <Navigate to="/" replace />;
  const userRole = data.role as 'member'|'coach'|'superadmin'|'admin';
  const ok =
    userRole === role ||
    // superadmin can access coach/admin routes
    (role === 'coach' && userRole === 'superadmin') ||
    (role === 'admin' && (userRole === 'superadmin' || userRole === 'admin'));
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
