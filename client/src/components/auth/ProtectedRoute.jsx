/**
 * Protected Route Component
 * Restricts access to authenticated users only
 * Redirects to login with return URL for post-login redirect
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute - Only renders component if user is authenticated
 * 
 * @param {Object} props - Component props
 * @param {React.Component} props.component - Component to render if authenticated
 * @param {Object} props.roleRequired - Optional role requirement (user, seller, admin, super_admin)
 * @returns {React.Component} Protected component or redirect to login
 * 
 * @example
 * <Route element={<ProtectedRoute component={Profile} />} path="/profile" />
 * 
 * @example
 * // Admin only route
 * <Route element={<ProtectedRoute component={AdminDash} roleRequired={['admin', 'super_admin']} />} path="/admin" />
 */
export function ProtectedRoute({ component: Component, roleRequired = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated) {
    // Save the attempted URL to redirect back after login
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirect=${redirectUrl}`} replace />;
  }

  // Check role if required
  if (roleRequired && !roleRequired.includes(user?.role)) {
    // User doesn't have required role
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource.
          </p>
          <a href="/" className="text-blue-500 hover:underline">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  // Authenticated and authorized - render component
  return <Component />;
}

/**
 * Admin-only Route
 * 
 * @param {Object} props - Component props
 * @param {React.Component} props.component - Component to render if user is admin
 * @returns {React.Component} Protected admin component
 * 
 * @example
 * <Route element={<AdminRoute component={AdminDashboard} />} path="/admin" />
 */
export function AdminRoute({ component: Component }) {
  return (
    <ProtectedRoute
      component={Component}
      roleRequired={['admin', 'super_admin']}
    />
  );
}

/**
 * Seller-only Route
 * 
 * @param {Object} props - Component props
 * @param {React.Component} props.component - Component to render if user is seller
 * @returns {React.Component} Protected seller component
 * 
 * @example
 * <Route element={<SellerRoute component={SellerDashboard} />} path="/seller" />
 */
export function SellerRoute({ component: Component }) {
  return (
    <ProtectedRoute
      component={Component}
      roleRequired={['seller']}
    />
  );
}

/**
 * Public Route - Redirects authenticated users away from auth pages
 * Prevents logged-in users from seeing login/register pages
 * 
 * @param {Object} props - Component props
 * @param {React.Component} props.component - Component to render if not authenticated
 * @param {string} props.redirectTo - Path to redirect authenticated users to (default: "/")
 * @returns {React.Component} Public component or redirect
 * 
 * @example
 * <Route element={<PublicRoute component={Login} />} path="/login" />
 */
export function PublicRoute({ component: Component, redirectTo = '/' }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Already authenticated - redirect to appropriate dashboard or home
  if (isAuthenticated) {
    // Determine redirect based on user role
    let defaultRedirect = redirectTo;
    
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      defaultRedirect = '/admin/dashboard';
    } else if (user?.role === 'seller') {
      defaultRedirect = '/seller/dashboard';
    } else {
      defaultRedirect = '/shop/home';
    }

    // Check if there's a redirect param in the URL (from previous navigation)
    const params = new URLSearchParams(location.search);
    const savedRedirect = params.get('redirect');

    return <Navigate to={savedRedirect || defaultRedirect} replace />;
  }

  // Not authenticated - show component
  return <Component />;
}

export default ProtectedRoute;
