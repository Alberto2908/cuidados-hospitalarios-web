"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "PACIENTE" | "CUIDADOR" | "ADMIN";

export interface AuthUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const MOCK_USERS: Record<UserRole, AuthUser> = {
  PACIENTE: {
    id: "1",
    nombre: "María",
    apellido: "García",
    email: "maria@example.com",
    role: "PACIENTE",
  },
  CUIDADOR: {
    id: "2",
    nombre: "Carlos",
    apellido: "López",
    email: "carlos@example.com",
    role: "CUIDADOR",
  },
  ADMIN: {
    id: "3",
    nombre: "Admin",
    apellido: "Sistema",
    email: "admin@cuidados.es",
    role: "ADMIN",
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (role: UserRole) => setUser(MOCK_USERS[role]);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
