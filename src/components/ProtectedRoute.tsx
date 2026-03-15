import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";
import { useHasAnyRole } from "@/hooks/useUserRole";
import { canAccessRoute } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Rotas permitidas em modo demo (somente visualização)
const DEMO_ALLOWED_ROUTES = [
  "/dashboard", "/leads", "/crm", "/campaigns", "/products",
  "/reports", "/surveys",
];

function isDemoRouteAllowed(path: string): boolean {
  return DEMO_ALLOWED_ROUTES.some(r => path === r || path.startsWith(r + "/"));
}

// TODO: Remover antes de ir para produção
const BYPASS_AUTH = true;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { isDemo } = useDemo();
  const { hasRole, role, isLoading: isRoleLoading } = useHasAnyRole();
  const location = useLocation();

  if (BYPASS_AUTH) return <>{children}</>;


  // Demo mode: allow only view-only routes
  if (isDemo) {
    if (!isDemoRouteAllowed(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (isLoading || (user && isRoleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated but has no role assigned
  if (!hasRole) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check role-based route access
  if (!canAccessRoute(role, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
