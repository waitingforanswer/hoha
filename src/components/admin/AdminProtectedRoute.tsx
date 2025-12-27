import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AdminProtectedRoute({ 
  children, 
  redirectTo = "/admin/login"
}: AdminProtectedRouteProps) {
  const { isAuthenticated, canAccessAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!canAccessAdmin) {
    // Logged in but not admin/sub_admin - redirect to login with message
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
