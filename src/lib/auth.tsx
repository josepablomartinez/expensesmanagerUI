import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setTokenGetter } from "@/lib/api";

const STORAGE_KEY = "expenses_jwt";

interface AuthContextValue {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  React.useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  const login = React.useCallback(async (username: string, password: string) => {
    // NOTE: the Go API doesn't expose an auth endpoint yet — this is wired
    // ahead of time so the frontend doesn't need to change once it does.
    // Expected contract: POST /auth/login {username, password} -> {token}
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error("Invalid credentials");
    }
    const { token: newToken } = (await res.json()) as { token: string };
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
