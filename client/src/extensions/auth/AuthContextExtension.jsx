import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "./authApi";

const AuthExtensionContext = createContext(null);

function getStoredRedirect() {
  return localStorage.getItem("auth_redirect_url") || "/";
}

export function saveRedirectPath(pathname) {
  if (pathname && pathname.startsWith("/")) {
    localStorage.setItem("auth_redirect_url", pathname);
  }
}

export function consumeRedirectPath() {
  const value = getStoredRedirect();
  localStorage.removeItem("auth_redirect_url");
  return value || "/";
}

export function AuthContextExtensionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authApi
      .refresh()
      .then((response) => {
        if (!mounted) return;
        if (response.data?.success) {
          setUser(response.data.user);
        }
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const timeoutMs = 30 * 60 * 1000;
    const timer = setInterval(async () => {
      try {
        await authApi.refresh();
      } catch (error) {
        setUser(null);
      }
    }, timeoutMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(payload) {
        const response = await authApi.login(payload);
        setUser(response.data?.user || null);
        return response.data;
      },
      async register(payload) {
        const response = await authApi.register(payload);
        return response.data;
      },
      async logout() {
        await authApi.logout();
        setUser(null);
      },
      async logoutAllDevices() {
        await authApi.logoutAll();
        setUser(null);
      },
    }),
    [loading, user]
  );

  return <AuthExtensionContext.Provider value={value}>{children}</AuthExtensionContext.Provider>;
}

export function useAuthExtension() {
  const context = useContext(AuthExtensionContext);
  if (!context) throw new Error("useAuthExtension must be used inside AuthContextExtensionProvider");
  return context;
}
