"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SWRConfig } from "swr";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { UNAUTHORIZED_EVENT, http, type ApiError } from "@/lib/api";
import { api, routes } from "@/lib/endpoints";
import { fetcher } from "@/lib/fetcher";
import { clearToken, getToken, setToken } from "@/lib/token";
import type { AuthResponse, CurrentUser } from "@/lib/types";

type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  user: CurrentUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <Providers>");
  }
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anon");
    router.push(routes.login);
  }, [router]);

  // Restore session on mount.
  useEffect(() => {
    if (!getToken()) {
      setStatus("anon");
      return;
    }
    let cancelled = false;
    http
      .get<CurrentUser>(api.me)
      .then((res) => {
        if (cancelled) return;
        setUser(res.data);
        setStatus("authed");
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
        setStatus("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to 401s surfaced by the axios interceptor / SWR.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anon");
      router.push(routes.login);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router]);

  const authenticate = useCallback(
    async (path: string, email: string, password: string) => {
      const res = await http.post<AuthResponse>(path, {
        email,
        password,
      });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      setStatus("authed");
      router.push(routes.home);
    },
    [router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login: (email, password) => authenticate(api.login, email, password),
      register: (email, password) =>
        authenticate(api.register, email, password),
      logout,
    }),
    [user, status, authenticate, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        shouldRetryOnError: false,
        onError: (err: ApiError) => {
          if (err?.status === 401 && typeof window !== "undefined") {
            window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
          }
        },
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <AuthProvider>{children}</AuthProvider>{" "}
      </ThemeProvider>
    </SWRConfig>
  );
}
