import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signInWithPopup } from "firebase/auth";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { auth, googleProvider, isFirebaseConfigured } from "@/config/firebase-config";
import { checkAuth, loginUser, loginWithGoogle } from "@/store/auth-slice";
import { AUTH_MODAL_EVENT } from "@/lib/auth-modal";

function safeRedirectPath(path) {
  return path?.startsWith("/") ? path : "/shop/home";
}

function AuthModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/shop/home");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: true,
  });

  useEffect(() => {
    function handleOpenAuthModal(event) {
      const nextRedirect =
        event.detail?.redirectTo ||
        `${location.pathname}${location.search || ""}`;

      setRedirectTo(safeRedirectPath(nextRedirect));
      setOpen(true);
    }

    window.addEventListener(AUTH_MODAL_EVENT, handleOpenAuthModal);

    return () => {
      window.removeEventListener(AUTH_MODAL_EVENT, handleOpenAuthModal);
    };
  }, [location.pathname, location.search]);

  async function finishLogin(user) {
    await dispatch(checkAuth());
    setOpen(false);

    if (user?.role === "seller") {
      navigate("/seller/dashboard", { replace: true });
      return;
    }

    if (user?.role === "admin" || user?.role === "super_admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!formData.identifier.trim() || !formData.password) {
      toast({
        title: "Enter email/phone and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const action = await dispatch(loginUser(formData));
    setLoading(false);

    if (action.payload?.success) {
      toast({ title: "Login successful" });
      await finishLogin(action.payload.user);
      return;
    }

    toast({
      title: action.payload?.message || "Login failed",
      variant: "destructive",
    });
  }

  async function handleGoogleLogin() {
    try {
      if (!isFirebaseConfigured || !auth || !googleProvider) {
        toast({
          title: "Google sign in is not configured",
          variant: "destructive",
        });
        return;
      }

      setGoogleLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseIdToken = await result.user.getIdToken();
      const action = await dispatch(loginWithGoogle({ firebaseIdToken }));

      if (action.payload?.success) {
        toast({ title: "Google login successful" });
        await finishLogin(action.payload.user);
        return;
      }

      if (action.payload?.profileCompletionRequired) {
        setOpen(false);
        navigate("/auth/register", { replace: true });
        toast({
          title: "Complete phone verification to continue",
        });
        return;
      }

      toast({
        title: action.payload?.message || "Google login failed",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: error?.message || "Google sign in failed",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-lg p-0">
        <div className="rounded-t-lg bg-slate-950 px-4 py-5 text-white sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black sm:text-2xl">Login</DialogTitle>
            <DialogDescription className="text-slate-300">
              Sign in to continue with cart, wishlist, checkout, and orders.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email or phone</Label>
              <Input
                value={formData.identifier}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    identifier: event.target.value,
                  })
                }
                placeholder="you@example.com or 9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      password: event.target.value,
                    })
                  }
                  placeholder="Enter password"
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-2.5 text-sm font-medium text-slate-500 hover:text-slate-950"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      rememberMe: event.target.checked,
                    })
                  }
                />
                Remember me
              </label>

              <Link
                to="/auth/forgot-password"
                onClick={() => setOpen(false)}
                className="font-medium text-slate-950 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full">
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase text-slate-400">
              Or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="h-11 w-full gap-3"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="h-5 w-5"
              alt="Google"
            />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <p className="mt-5 text-center text-sm text-slate-500">
            New customer?
            <Link
              to={`/auth/register?redirect=${encodeURIComponent(redirectTo)}`}
              onClick={() => setOpen(false)}
              className="ml-1 font-semibold text-slate-950 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
