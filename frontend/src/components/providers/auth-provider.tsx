"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import { useRouter, usePathname } from "next/navigation";

export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  email: string;
  role: Role;
  is_active: boolean;
  school_id: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname]);

  const login = (userData: User) => {
    setUser(userData);
    switch (userData.role) {
      case "SUPER_ADMIN":
        router.push("/super-admin");
        break;
      case "SCHOOL_ADMIN":
        router.push("/school-admin");
        break;
      case "TEACHER":
        router.push("/teacher");
        break;
      case "STUDENT":
        router.push("/student");
        break;
      default:
        router.push("/");
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
