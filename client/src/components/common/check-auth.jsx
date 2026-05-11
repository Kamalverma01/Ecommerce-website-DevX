import { Navigate, useLocation } from "react-router-dom";

function CheckAuth({ isAuthenticated, user, children }) {
  const location = useLocation();
  const redirectPath = new URLSearchParams(location.search).get("redirect");
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSeller = user?.role === "seller";
  const isSellerApplicationPage = location.pathname === "/seller/application";
  const isAuthPage =
    location.pathname.includes("/login") ||
    location.pathname.includes("/register") ||
    location.pathname.includes("/forgot-password");
  const isPublicPage =
    location.pathname.startsWith("/shop") ||
    location.pathname.startsWith("/marketplace");

  const attemptedUrl = `${location.pathname}${location.search || ""}`;

  if (location.pathname === "/") {
    if (!isAuthenticated) {
      return <Navigate to="/shop/home" />;
    } else {
      if (isAdmin) {
        return <Navigate to="/admin/dashboard" />;
      } else if (isSeller) {
        return <Navigate to="/seller/dashboard" />;
      } else {
        return <Navigate to="/shop/home" />;
      }
    }
  }

  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(attemptedUrl)}`} />;
  }

  if (isAuthenticated && isAuthPage) {
    if (redirectPath?.startsWith("/")) {
      return <Navigate to={redirectPath} />;
    }

    if (isAdmin) {
      return <Navigate to="/admin/dashboard" />;
    } else if (isSeller) {
      return <Navigate to="/seller/dashboard" />;
    } else {
      return <Navigate to="/shop/home" />;
    }
  }

  if (
    isAuthenticated &&
    location.pathname.includes("admin")
  ) {
    return isAdmin ? <>{children}</> : <Navigate to="/unauth-page" />;
  }

  if (
    isAuthenticated &&
    location.pathname.includes("seller") &&
    !isSellerApplicationPage
  ) {
    if (isSeller) return <>{children}</>;
    if (isAdmin) return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/unauth-page" />;
  }

  if (
    isAuthenticated &&
    isSeller &&
    location.pathname.includes("shop")
  ) {
    return <Navigate to="/seller/dashboard" />;
  }

  if (
    isAuthenticated &&
    isAdmin &&
    (location.pathname.includes("shop") || location.pathname.includes("seller"))
  ) {
    return <Navigate to="/admin/dashboard" />;
  }

  if (isAuthenticated && !user && !isAuthPage) {
    return <Navigate to="/auth/login" />;
  }

  return <>{children}</>;
}

export default CheckAuth;
