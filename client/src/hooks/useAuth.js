/**
 * Custom Auth Hooks
 * Provides useful utilities for working with authentication
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken, isTokenExpiringSoon } from '@/utils/token';

/**
 * Hook to automatically refresh token before expiry
 * 
 * Monitors the access token and triggers refresh when:
 * - Token is expiring soon (within 2 minutes)
 * - Component mounts and token is checked
 * 
 * @param {number} checkInterval - Interval to check token expiry in ms (default: 30000ms = 30s)
 * 
 * @example
 * function MyComponent() {
 *   useTokenRefresh(); // Automatically refresh token
 *   return <div>Protected content</div>;
 * }
 */
export function useTokenRefresh(checkInterval = 30000) {
  const { refreshToken } = useAuth();
  const intervalRef = useRef(null);

  const checkAndRefresh = useCallback(async () => {
    const token = getAccessToken();

    if (token && isTokenExpiringSoon()) {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
  }, [refreshToken]);

  useEffect(() => {
    // Check immediately on mount
    checkAndRefresh();

    // Set up interval to check periodically
    intervalRef.current = setInterval(checkAndRefresh, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAndRefresh, checkInterval]);
}

/**
 * Hook to handle logout and redirect
 * 
 * Clears auth state and redirects to login page
 * 
 * @returns {Function} logout function
 * 
 * @example
 * function Profile() {
 *   const handleLogout = useLogout();
 *   return <button onClick={handleLogout}>Logout</button>;
 * }
 */
export function useLogout() {
  const { logout } = useAuth();

  return useCallback(async () => {
    try {
      await logout();
      // Redirect will be handled by App.js based on auth state change
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);
}

/**
 * Hook to protect a route - useful for programmatic checks
 * 
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Object} { hasAccess, isLoading, userRole }
 * 
 * @example
 * function AdminFeature() {
 *   const { hasAccess, isLoading } = useRouteGuard(['admin', 'super_admin']);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!hasAccess) return <div>Access Denied</div>;
 *   
 *   return <AdminPanel />;
 * }
 */
export function useRouteGuard(allowedRoles = null) {
  const { user, isLoading, isAuthenticated } = useAuth();

  const hasAccess = useCallback(() => {
    if (!isAuthenticated) return false;
    if (!allowedRoles) return true;
    return allowedRoles.includes(user?.role);
  }, [isAuthenticated, user?.role, allowedRoles]);

  return {
    hasAccess: hasAccess(),
    isLoading,
    userRole: user?.role,
  };
}

/**
 * Hook to check if specific role
 * 
 * @param {string|Array<string>} roles - Single role or array of roles to check
 * @returns {boolean} True if user has the role
 * 
 * @example
 * function Dashboard() {
 *   const isAdmin = useHasRole('admin');
 *   const isSeller = useHasRole(['seller', 'admin']);
 *   
 *   return (
 *     <div>
 *       {isAdmin && <AdminPanel />}
 *       {isSeller && <SellerPanel />}
 *     </div>
 *   );
 * }
 */
export function useHasRole(roles) {
  const { user } = useAuth();

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return user ? rolesArray.includes(user.role) : false;
}

/**
 * Hook to get user's role
 * 
 * @returns {string|null} User role or null if not authenticated
 * 
 * @example
 * function Component() {
 *   const role = useUserRole();
 *   return <div>Your role: {role}</div>;
 * }
 */
export function useUserRole() {
  const { user } = useAuth();
  return user?.role || null;
}

/**
 * Hook for session timeout - logs out user after inactivity
 * 
 * @param {number} timeoutMs - Inactivity timeout in milliseconds (default: 30 minutes)
 * 
 * @example
 * function App() {
 *   useSessionTimeout(30 * 60 * 1000); // 30 minutes
 *   return <Routes>...</Routes>;
 * }
 */
export function useSessionTimeout(timeoutMs = 30 * 60 * 1000) {
  const { logout } = useAuth();
  const timeoutRef = useRef(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [logout, timeoutMs]);

  useEffect(() => {
    // Reset timeout on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimeout();
    };

    // Set initial timeout
    resetTimeout();

    // Add listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimeout]);
}

export default {
  useTokenRefresh,
  useLogout,
  useRouteGuard,
  useHasRole,
  useUserRole,
  useSessionTimeout,
};
