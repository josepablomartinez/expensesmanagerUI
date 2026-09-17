import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, type AuthUser } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  // Starts true: there's no client-readable token to check anymore (the
  // session lives in an HttpOnly cookie), so the only way to know "am I
  // logged in" on page load is to ask the API.
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    await api.auth.login(email, password);
    // The login response itself doesn't carry the user's profile -- fetch
    // it via the newly-set session cookie so ProtectedRoute and anything
    // else reading `user` sees it immediately, without a page reload.
    const me = await api.auth.me();
    setUser(me);
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      // Clear client-side state regardless of whether the network call
      // succeeded -- the user asked to leave; ProtectedRoute reacting to
      // user becoming null is what actually navigates them to /login.
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Avoid a flash-redirect to /login before the initial GET /auth/me call
  // (above) has had a chance to resolve.
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
