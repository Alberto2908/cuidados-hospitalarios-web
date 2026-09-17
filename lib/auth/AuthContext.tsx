"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/lib/auth/api";
import type { ActualizarPerfilDatos, RegistroDatos, UsuarioActual } from "@/lib/auth/api";
import type { Hospital } from "@/lib/mock/hospitales";

export type { UserRole, UserEstado, UsuarioActual } from "@/lib/auth/api";
export type AuthUser = UsuarioActual;

const AUTH_QUERY_KEY = ["auth", "me"] as const;

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginConGoogle: (idToken: string) => Promise<AuthUser>;
  registrar: (datos: RegistroDatos) => Promise<AuthUser>;
  logout: () => void;
  actualizarPerfil: (datos: ActualizarPerfilDatos) => Promise<AuthUser>;
  convertirseCuidador: () => Promise<AuthUser>;
  obtenerStripeOnboardingLink: () => Promise<{ url: string }>;
  sincronizarStripe: () => Promise<AuthUser>;
  cambiarContrasena: (actual: string, nueva: string) => Promise<void>;
  actualizarHospitales: (hospitalIds: string[]) => Promise<Hospital[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authApi.obtenerUsuarioActual();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const googleMutation = useMutation({
    mutationFn: (idToken: string) => authApi.loginConGoogle(idToken),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const registroMutation = useMutation({
    mutationFn: (datos: RegistroDatos) => authApi.registrar(datos),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.cerrarSesion,
    onSettled: () => queryClient.setQueryData(AUTH_QUERY_KEY, null),
  });

  const actualizarPerfilMutation = useMutation({
    mutationFn: (datos: ActualizarPerfilDatos) => authApi.actualizarPerfil(datos),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const convertirseCuidadorMutation = useMutation({
    mutationFn: authApi.convertirseCuidador,
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const sincronizarStripeMutation = useMutation({
    mutationFn: authApi.sincronizarStripe,
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const cambiarContrasenaMutation = useMutation({
    mutationFn: ({ actual, nueva }: { actual: string; nueva: string }) =>
      authApi.cambiarContrasena(actual, nueva),
  });

  const actualizarHospitalesMutation = useMutation({
    mutationFn: (hospitalIds: string[]) => authApi.actualizarHospitales(hospitalIds),
    onSuccess: (hospitalesTrabajo) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, (actual: AuthUser | null | undefined) =>
        actual ? { ...actual, hospitalesTrabajo } : actual,
      );
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
        login: (email, password) => loginMutation.mutateAsync({ email, password }),
        loginConGoogle: (idToken) => googleMutation.mutateAsync(idToken),
        registrar: (datos) => registroMutation.mutateAsync(datos),
        logout: () => logoutMutation.mutate(),
        actualizarPerfil: (datos) => actualizarPerfilMutation.mutateAsync(datos),
        convertirseCuidador: () => convertirseCuidadorMutation.mutateAsync(),
        obtenerStripeOnboardingLink: () => authApi.obtenerStripeOnboardingLink(),
        sincronizarStripe: () => sincronizarStripeMutation.mutateAsync(),
        cambiarContrasena: (actual, nueva) => cambiarContrasenaMutation.mutateAsync({ actual, nueva }),
        actualizarHospitales: (hospitalIds) => actualizarHospitalesMutation.mutateAsync(hospitalIds),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
