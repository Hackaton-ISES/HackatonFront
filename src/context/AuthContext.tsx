import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mockCredentials } from "@/lib/mockUsers";
import type { User } from "@/types/tender";

interface AuthContextValue {
  user: User | null;
  login: (login: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "tender_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const login = async (loginId: string, password: string): Promise<User> => {
    await new Promise((r) => setTimeout(r, 400));
    const match = mockCredentials.find(
      (c) => c.user.login.toLowerCase() === loginId.trim().toLowerCase() && c.password === password,
    );
    if (!match) throw new Error("Invalid login or password");
    setUser(match.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match.user));
    return match.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
