import { Navigate, useLocation } from "react-router-dom";
import { saveRedirectPath, useAuthExtension } from "./AuthContextExtension";

export default function ProtectedRouteExtension({ children, roles = [] }) {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuthExtension();

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Checking session...</div>;
  }

  if (!isAuthenticated) {
    saveRedirectPath(location.pathname + location.search);
    return <Navigate to="/auth/login" replace />;
  }

  if (roles.length && !roles.includes(user?.role)) {
    return <Navigate to="/unauth-page" replace />;
  }

  return children;
}
