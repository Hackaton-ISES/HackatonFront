import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  clearStoredSession,
  getCurrentUser,
  loginUser,
  registerCompany,
  logoutUser,
  setStoredSession,
} from "@/lib/api";
import type { User } from "@/types/tender";

interface AuthContextValue {
  user: User | null;
  login: (login: string, password: string) => Promise<User>;
  register: (input: {
    companyName: string;
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        clearStoredSession();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (loginId: string, password: string): Promise<User> => {
    const session = await loginUser(loginId.trim(), password);
    setStoredSession(session.user, session.token);
    setUser(session.user);
    return session.user;
  };

  const register = async (input: {
    companyName: string;
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> => {
    const session = await registerCompany(input);
    setStoredSession(session.user, session.token);
    setUser(session.user);
    return session.user;
  };

  const logout = () => {
    void logoutUser().catch(() => undefined);
    clearStoredSession();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
