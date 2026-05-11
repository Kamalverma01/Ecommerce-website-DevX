import {
  ChevronDown,
  Grid3X3,
  Bell,
  LogIn,
  LogOut,
  Menu,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserCog,
  Store,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { logoutUser } from "@/store/auth-slice";
import UserCartWrapper from "./cart-wrapper";
import { useEffect, useState } from "react";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { fetchUserAlerts, markAlertRead } from "@/store/shop/alert-slice";
import { fetchBrands, fetchCategories } from "@/store/catalog-slice";
import myLogo from "../../assets/pscwhitelogo.png";
import { openAuthModal } from "@/lib/auth-modal";
import { Mail } from "lucide-react";

const baseMenuItems = [
  // {
  //   id: "home",
  //   label: "Home",
  //   path: "/shop/home",
  // },
  {
    id: "products",
    label: "Products",
    path: "/shop/listing",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    path: "/shop/wishlist",
    authRequired: true,
  },
  {
    id: "search",
    label: "Search",
    path: "/shop/search",
  },
  // {
  //   id: "seller",
  //   label: "Sell",
  //   path: "/seller/application",
  // },
];

function LoadingDot() {
  return <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />;
}

function MenuItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { categories, brands, isLoading } = useSelector(
    (state) => state.catalog,
  );
  const { user } = useSelector((state) => state.auth);
  const [openMenu, setOpenMenu] = useState(null);
  const menuItems = baseMenuItems;

  function handleNavigate(getCurrentMenuItem, filterType = null) {
    if (getCurrentMenuItem.authRequired && !user?.id) {
      openAuthModal(getCurrentMenuItem.path);
      return;
    }

    sessionStorage.removeItem("filters");
    const currentFilter = filterType
      ? { [filterType]: [getCurrentMenuItem.id] }
      : null;

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));

    location.pathname.includes("listing") && currentFilter !== null
      ? setSearchParams(
          new URLSearchParams(`${filterType}=${getCurrentMenuItem.id}`),
        )
      : navigate(getCurrentMenuItem.path);
  }

  function toggleMenu(menu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-2 lg:flex-row">
      {menuItems.map((menuItem) => (
        <button
          type="button"
          onClick={() => handleNavigate(menuItem)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-slate-100 hover:text-amber-600"
          key={menuItem.id}
        >
          {menuItem.id === "products" ? (
            <PackageSearch className="h-4 w-4" />
          ) : null}
          {menuItem.id === "search" ? <Search className="h-4 w-4" /> : null}
          {menuItem.id === "seller" ? <Store className="h-4 w-4" /> : null}
          {menuItem.label}
        </button>
      ))}

      <div className="group relative">
        <button
          type="button"
          onClick={() => toggleMenu("categories")}
          className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-slate-100 hover:text-amber-600 lg:w-auto"
        >
          <span className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Categories
          </span>
          {isLoading ? <LoadingDot /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div
          className={`z-50 mt-2 w-full rounded-md border bg-white p-2 shadow-xl transition-all duration-200 ${
            openMenu === "categories" ? "block" : "hidden"
          } lg:invisible lg:absolute lg:left-0 lg:block lg:w-64 lg:translate-y-2 lg:opacity-0 lg:group-hover:visible lg:group-hover:translate-y-0 lg:group-hover:opacity-100`}
        >
          {categories.length ? (
            categories.map((category) => (
              <button
                type="button"
                key={category._id}
                onClick={() =>
                  handleNavigate(
                    {
                      id: category.slug,
                      label: category.name,
                      path: "/shop/listing",
                    },
                    "category",
                  )
                }
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
              >
                <span>{category.name}</span>
                <span className="text-xs text-slate-400">{category.slug}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No categories yet
            </p>
          )}
        </div>
      </div>

      <div className="group relative">
        <button
          type="button"
          onClick={() => toggleMenu("brands")}
          className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-slate-100 hover:text-amber-600 lg:w-auto"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Brands
          </span>
          {isLoading ? <LoadingDot /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div
          className={`z-50 mt-2 w-full rounded-md border bg-white p-3 shadow-xl transition-all duration-200 ${
            openMenu === "brands" ? "block" : "hidden"
          } lg:invisible lg:absolute lg:left-1/2 lg:block lg:w-[min(440px,calc(100vw-2rem))] lg:-translate-x-1/2 lg:translate-y-2 lg:opacity-0 lg:group-hover:visible lg:group-hover:-translate-x-1/2 lg:group-hover:translate-y-0 lg:group-hover:opacity-100`}
        >
          {brands.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brands.map((brand) => (
                <button
                  type="button"
                  key={brand._id}
                  onClick={() =>
                    handleNavigate(
                      {
                        id: brand.slug,
                        label: brand.name,
                        path: "/shop/listing",
                      },
                      "brand",
                    )
                  }
                  className="group/brand flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border bg-slate-50 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-md"
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-10 w-14 rounded-md object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-14 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-500">
                      {brand.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="line-clamp-2 text-xs font-semibold text-slate-700 group-hover/brand:text-amber-700">
                    {brand.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No brands yet
            </p>
          )}
        </div>
      </div>
    </nav>
  );
}

function HeaderRightContent() {
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { alerts } = useSelector((state) => state.alerts);
  const [openCartSheet, setOpenCartSheet] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
  }

  useEffect(() => {
    if (user?.id) dispatch(fetchCartItems(user?.id));
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (user?.id) dispatch(fetchUserAlerts());
  }, [dispatch, user?.id]);

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
      {user?.id ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full hover:shadow-md"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Activity Alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length ? (
              alerts.slice(0, 6).map((alert) => (
                <DropdownMenuItem
                  key={alert._id}
                  className="flex cursor-pointer flex-col items-start gap-1 whitespace-normal"
                  onClick={() => dispatch(markAlertRead(alert._id))}
                >
                  <span
                    className={`text-sm font-semibold ${alert.isRead ? "text-slate-500" : "text-slate-950"}`}
                  >
                    {alert.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {alert.message}
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="text-sm text-muted-foreground">
                No alerts yet
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Cart Section */}
      <Sheet open={openCartSheet} onOpenChange={() => setOpenCartSheet(false)}>
        <Button
          onClick={() => {
            if (!user?.id) {
              openAuthModal("/shop/checkout");
              return;
            }
            setOpenCartSheet(true);
          }}
          variant="outline"
          size="icon"
          className="relative rounded-full hover:shadow-md"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItems?.items?.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {cartItems.items.length}
            </span>
          )}
          <span className="sr-only">User cart</span>
        </Button>
        <UserCartWrapper
          setOpenCartSheet={setOpenCartSheet}
          cartItems={cartItems?.items || []}
        />
      </Sheet>

      {user?.id ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="bg-black cursor-pointer border-2 border-slate-100 transition-all hover:border-primary">
              <AvatarFallback className="bg-black text-white font-extrabold">
                {user?.userName?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-56">
            <DropdownMenuLabel className="font-bold">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/shop/account")}
              className="cursor-pointer"
            >
              <UserCog className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate(
                  user?.role === "seller"
                    ? "/seller/dashboard"
                    : "/seller/application",
                )
              }
              className="cursor-pointer"
            >
              <Store className="mr-2 h-4 w-4" />
              {user?.role === "seller" ? "Seller Panel" : "Apply as Seller"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/contact")}
              className="cursor-pointer"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex flex-col gap-2 lg:flex-row">
          <Button
            type="button"
            onClick={() => openAuthModal("/shop/account")}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/auth/register")}
          >
            Register
          </Button>
        </div>
      )}
    </div>
  );
}

function ShoppingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-3 sm:min-h-20 sm:px-4 md:px-8">
        {/* LEFT: Logo & Brand */}
        <div className="flex-shrink-0">
          <Link to="/shop/home" className="flex items-center gap-3 group">
            <img
              src={myLogo}
              alt="Logo"
              className="h-12 w-auto md:h-14 transition-transform group-hover:scale-105"
            />
            <span className="hidden sm:inline-block font-black text-lg tracking-tighter uppercase md:text-xl">
              Panjab Sports
            </span>
          </Link>
        </div>

        {/* CENTER: Navigation (Desktop) */}
        <div className="hidden lg:flex flex-1 justify-center">
          <MenuItems />
        </div>

        {/* RIGHT: User Actions (Desktop) + Mobile Toggle */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="hidden lg:block">
            <HeaderRightContent />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="touch-target lg:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle header menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(92vw,22rem)] flex-col pt-10"
            >
              <div className="mb-8 border-b pb-4">
                <img src={myLogo} alt="Logo" className="h-12 w-auto mb-2" />
                <span className="font-bold">Panjab Sports Club</span>
              </div>
              <MenuItems />
              <div className="mt-auto pt-6 border-t">
                <HeaderRightContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default ShoppingHeader;
