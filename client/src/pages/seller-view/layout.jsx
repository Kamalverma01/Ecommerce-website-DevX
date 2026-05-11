import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu } from "lucide-react"; // npm install lucide-react
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import myLogo from "../../assets/pscwhitelogo.png"; // Adjust path to your logo

function SellerLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const isApprovedSeller = user?.role === "seller";

  const navItems = [
    { to: "dashboard", label: "Dashboard" },
    { to: "products", label: "Products" },
    { to: "orders", label: "Orders" },
    { to: "marketplace", label: "Marketplace" },
    { to: "profile", label: "Profile" },
  ];

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-all ${
      isActive ? "bg-black text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
          
          {/* LOGO & MOBILE TRIGGER */}
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
                  <Menu className="h-6 w-6 text-slate-600" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-6 border-b text-left">
                    <SheetTitle className="flex items-center gap-3">
                      <img src={myLogo} alt="Logo" className="h-9 w-auto" />
                      <span className="text-xl font-bold tracking-tight">PSC Seller Panel</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <nav className="flex flex-col gap-2 p-4">
                    {isApprovedSeller && navItems.map((item) => (
                      <NavLink 
                        key={item.to} 
                        to={item.to} 
                        onClick={() => setOpen(false)}
                        className={linkClass}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                    <div className="my-2 border-t border-slate-100" />
                    <NavLink to="/" onClick={() => setOpen(false)} className={linkClass}>
                      Home
                    </NavLink>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <img src={myLogo} alt="Logo" className="h-8 w-auto hidden sm:block" />
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 leading-none">Seller Panel</p>
                <h1 className="text-lg font-bold text-slate-900 hidden md:block">Workspace</h1>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-3">
            {isApprovedSeller && navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <NavLink className={linkClass} to="/">Home</NavLink>
          </nav>

          {/* USER AVATAR (Quick Design Add-on) */}
          {/* <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100">
              {user?.name?.charAt(0) || "S"}
            </div>
          </div> */}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Marketplace Seller Workspace</h2>
            <p className="text-slate-500 text-sm">Manage your listings, orders, and shop performance.</p>
        </div>
        
        {/* Content Wrapper */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[60vh]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default SellerLayout;