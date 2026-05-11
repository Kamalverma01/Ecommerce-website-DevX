import {
  BadgeCheck,
  LayoutDashboard,
  ShoppingBasket,
  Tags,
  Store,
  LifeBuoy, // Added for Support
  ShieldCheck,
  UserCog,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import myLogo from "../../assets/pscwhitelogo.png";

const adminSidebarMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard />,
  },
  {
    id: "products",
    label: "Products",
    path: "/admin/products",
    icon: <ShoppingBasket />,
  },
  {
    id: "catalog",
    label: "Catalog",
    path: "/admin/catalog",
    icon: <Tags />,
  },
  {
    id: "sellers",
    label: "Sellers",
    path: "/admin/sellers",
    icon: <Store />,
  },
  {
    id: "orders",
    label: "Orders",
    path: "/admin/orders",
    icon: <BadgeCheck />,
  },
  {
    id: "support",
    label: "Support",
    path: "/admin/support", // Ensure this route is defined in App.jsx
    icon: <LifeBuoy />,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    path: "/admin/marketplace",
    icon: <ShieldCheck />,
  },
  {
    id: "financial",
    label: "Financial Dashboard",
    path: "/admin/financial",
    icon: <TrendingUp />,
  },
  {
    id: "seller-commissions",
    label: "Seller Commissions",
    path: "/admin/seller-commissions",
    icon: <Users />,
  },
  {
    id: "fraud-logs",
    label: "Fraud Logs",
    path: "/admin/fraud-logs",
    icon: <AlertTriangle />,
  },
  // {
  //   id: "profile",
  //   label: "Profile",
  //   path: "/admin/profile",
  //   icon: <UserCog />,
  // },
];

function MenuItems({ setOpen }) {
  const navigate = useNavigate();

  return (
    <nav className="mt-8 flex-col flex gap-2">
      {adminSidebarMenuItems.map((menuItem) => (
        <div
          key={menuItem.id}
          onClick={() => {
            navigate(menuItem.path);
            setOpen ? setOpen(false) : null;
          }}
          className="flex cursor-pointer text-lg items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          {menuItem.icon}
          <span className="font-medium">{menuItem.label}</span>
        </div>
      ))}
    </nav>
  );
}

function AdminSideBar({ open, setOpen }) {
  const navigate = useNavigate();

  return (
    <Fragment>
      {/* MOBILE SIDEBAR */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b pb-4">
              <SheetTitle className="flex flex-col gap-4 mt-5">
                <div className="flex items-center gap-2">
                  <img src={myLogo} alt="Logo" className="h-10 w-auto" />
                  <span className="text-xl font-bold tracking-tight">PSC Admin</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r bg-background p-6 lg:flex">
        <div
          onClick={() => navigate("/admin/dashboard")}
          className="flex cursor-pointer items-center gap-3 border-b pb-6"
        >
          <img src={myLogo} alt="Logo" className="h-12 w-auto" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Panjab Sports
            </p>
          </div>
        </div>
        <MenuItems />
      </aside>
    </Fragment>
  );
}

export default AdminSideBar;
