// import { Route, Routes } from "react-router-dom";
// import AuthLayout from "./components/auth/layout";
// import AuthLogin from "./pages/auth/login";
// import AuthRegister from "./pages/auth/register";
// import AdminLayout from "./components/admin-view/layout";
// import AdminDashboard from "./pages/admin-view/dashboard";
// import AdminProducts from "./pages/admin-view/products";
// import AdminOrders from "./pages/admin-view/orders";
// import AdminFeatures from "./pages/admin-view/features";
// import ShoppingLayout from "./components/shopping-view/layout";
// import NotFound from "./pages/not-found";
// import ShoppingHome from "./pages/shopping-view/home";
// import ShoppingListing from "./pages/shopping-view/listing";
// import ShoppingCheckout from "./pages/shopping-view/checkout";
// import ShoppingAccount from "./pages/shopping-view/account";
// import CheckAuth from "./components/common/check-auth";
// import UnauthPage from "./pages/unauth-page";
// import { useDispatch, useSelector } from "react-redux";
// import { useEffect } from "react";
// import { checkAuth } from "./store/auth-slice";
// import { Skeleton } from "@/components/ui/skeleton";
// import PaypalReturnPage from "./pages/shopping-view/paypal-return";
// import PaymentSuccessPage from "./pages/shopping-view/payment-success";
// import SearchProducts from "./pages/shopping-view/search";

// function App() {
//   const { user, isAuthenticated, isLoading } = useSelector(
//     (state) => state.auth
//   );
//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(checkAuth());
//   }, [dispatch]);

//   if (isLoading) return <Skeleton className="w-[800] bg-black h-[600px]" />;

//   console.log(isLoading, user);

//   return (
//     <div className="flex flex-col overflow-hidden bg-white">
//       <Routes>
//         <Route
//           path="/"
//           element={
//             <CheckAuth
//               isAuthenticated={isAuthenticated}
//               user={user}
//             ></CheckAuth>
//           }
//         />
//         <Route
//           path="/auth"
//           element={
//             <CheckAuth isAuthenticated={isAuthenticated} user={user}>
//               <AuthLayout />
//             </CheckAuth>
//           }
//         >
//           <Route path="login" element={<AuthLogin />} />
//           <Route path="register" element={<AuthRegister />} />
//         </Route>
//         <Route
//           path="/admin"
//           element={
//             <CheckAuth isAuthenticated={isAuthenticated} user={user}>
//               <AdminLayout />
//             </CheckAuth>
//           }
//         >
//           <Route path="dashboard" element={<AdminDashboard />} />
//           <Route path="products" element={<AdminProducts />} />
//           <Route path="orders" element={<AdminOrders />} />
//           <Route path="features" element={<AdminFeatures />} />
//         </Route>
//         <Route
//           path="/shop"
//           element={
//             <CheckAuth isAuthenticated={isAuthenticated} user={user}>
//               <ShoppingLayout />
//             </CheckAuth>
//           }
//         >
//           <Route path="home" element={<ShoppingHome />} />
//           <Route path="listing" element={<ShoppingListing />} />
//           <Route path="checkout" element={<ShoppingCheckout />} />
//           <Route path="account" element={<ShoppingAccount />} />
//           <Route path="paypal-return" element={<PaypalReturnPage />} />
//           <Route path="payment-success" element={<PaymentSuccessPage />} />
//           <Route path="search" element={<SearchProducts />} />
//         </Route>
//         <Route path="/unauth-page" element={<UnauthPage />} />
//         <Route path="*" element={<NotFound />} />
//       </Routes>
//     </div>
//   );
// }

// export default App;

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthLayout from "./components/auth/layout";
import AuthLogin from "./pages/auth/login";
import AuthRegister from "./pages/auth/register";
import ForgotPassword from "./pages/auth/forgot-password";
import AdminLayout from "./components/admin-view/layout";
import AdminDashboard from "./pages/admin-view/dashboard";
import AdminProducts from "./pages/admin-view/products";
import AdminOrders from "./pages/admin-view/orders";
import AdminFeatures from "./pages/admin-view/features";
import AdminCatalog from "./pages/admin-view/catalog";
import AdminSupportDashboard from "./pages/admin-view/support-dashboard";
import AdminSellers from "./pages/admin-view/sellers";
import AdminMarketplace from "./pages/admin-view/marketplace";
import AdminProfile from "./pages/admin-view/profile";
import AdminFinancial from "./pages/admin-view/financial";
import AdminSellerCommissions from "./pages/admin-view/seller-commissions";
import AdminFraudLogs from "./pages/admin-view/fraud-logs";
import ShoppingLayout from "./components/shopping-view/layout";
import NotFound from "./pages/not-found";
import ShoppingHome from "./pages/shopping-view/home";
import ShoppingListing from "./pages/shopping-view/listing";
import ShoppingCheckout from "./pages/shopping-view/checkout";
import ShoppingAccount from "./pages/shopping-view/account";
import CheckAuth from "./components/common/check-auth";
import UnauthPage from "./pages/unauth-page";
import Contact from "./pages/contact/contact";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./store/auth-slice";
import { Skeleton } from "@/components/ui/skeleton";
import RazorpayReturnPage from "./pages/shopping-view/paypal-return";
import PaymentSuccessPage from "./pages/shopping-view/payment-success";
import SearchProducts from "./pages/shopping-view/search";
import ShoppingWishlist from "./pages/shopping-view/wishlist";
import SellerLayout from "./pages/seller-view/layout";
import SellerDashboard from "./pages/seller-view/dashboard";
import SellerProducts from "./pages/seller-view/products";
import SellerOrders from "./pages/seller-view/orders";
import SellerApplication from "./pages/seller-view/application";
import SellerMarketplace from "./pages/seller-view/marketplace";
import SellerProfile from "./pages/seller-view/profile";
import MarketplacePlatform from "./pages/marketplace-view/platform";
import { useTokenRefresh, useSessionTimeout } from "@/hooks/useAuth"; // ADDING THESE HOOKS




function App() {
  useTokenRefresh();
  useSessionTimeout(30 * 60 * 1000);
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const isPublicRoute =
    location.pathname === "/" ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/shop") ||
    location.pathname.startsWith("/marketplace") ||
    location.pathname.startsWith("/contact");

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading && !isPublicRoute) {
    return <Skeleton className="h-screen w-full bg-slate-100" />;
  }

  return (
    <div className="flex flex-col overflow-hidden bg-white">
      <Routes>
        <Route
          path="/"
          element={
            <CheckAuth
              isAuthenticated={isAuthenticated}
              user={user}
            ></CheckAuth>
          }
        />
        <Route
          path="/auth"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AuthLayout />
            </CheckAuth>
          }
        >
          <Route path="login" element={<AuthLogin />} />
          <Route path="register" element={<AuthRegister />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="catalog" element={<AdminCatalog />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="features" element={<AdminFeatures />} />
          <Route path="support" element={<AdminSupportDashboard />} />
          <Route path="marketplace" element={<AdminMarketplace />} />
          <Route path="financial" element={<AdminFinancial />} />
          <Route path="seller-commissions" element={<AdminSellerCommissions />} />
          <Route path="fraud-logs" element={<AdminFraudLogs />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Shopping Routes */}
        <Route
          path="/shop"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ShoppingLayout />
            </CheckAuth>
          }
        >
          <Route path="home" element={<ShoppingHome />} />
          <Route path="listing" element={<ShoppingListing />} />
          <Route path="checkout" element={<ShoppingCheckout />} />
          <Route path="account" element={<ShoppingAccount />} />
          <Route path="razorpay-return" element={<RazorpayReturnPage />} />
          <Route path="paypal-return" element={<RazorpayReturnPage />} />
          <Route path="payment-success" element={<PaymentSuccessPage />} />
          <Route path="payment-error" element={<NotFound />} />
          <Route path="search" element={<SearchProducts />} />
          <Route path="wishlist" element={<ShoppingWishlist />} />
        </Route>

        {/* Seller Routes */}
        <Route
          path="/seller"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <SellerLayout />
            </CheckAuth>
          }
        >
          <Route
            index
            element={
              <Navigate
                to={user?.role === "seller" ? "dashboard" : "application"}
                replace
              />
            }
          />
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="application" element={<SellerApplication />} />
          <Route path="marketplace" element={<SellerMarketplace />} />
          <Route path="profile" element={<SellerProfile />} />
        </Route>

        <Route path="/unauth-page" element={<UnauthPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/marketplace" element={<MarketplacePlatform />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
