"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/lib/auth/api";
import { ApiError } from "@/lib/api/client";
import type {
  ActualizarPerfilDatos,
  RegistroDatos,
  TemaUsuario,
  UsuarioActual,
  VerificacionIdentidadDatos,
} from "@/lib/auth/api";
import type { Hospital } from "@/lib/mock/hospitales";

export type { UserRole, UserEstado, UsuarioActual, TemaUsuario } from "@/lib/auth/api";
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
  dejarDeSerCuidador: () => Promise<AuthUser>;
  enviarVerificacionIdentidad: (datos: VerificacionIdentidadDatos) => Promise<AuthUser>;
  marcarResultadoVerificacionVisto: () => Promise<AuthUser>;
  obtenerStripeOnboardingLink: () => Promise<{ url: string }>;
  sincronizarStripe: () => Promise<AuthUser>;
  cambiarContrasena: (actual: string, nueva: string) => Promise<void>;
  verificarEmail: (codigo: string) => Promise<AuthUser>;
  reenviarVerificacionEmail: () => Promise<void>;
  actualizarHospitales: (hospitalIds: string[]) => Promise<Hospital[]>;
  actualizarTarifaHora: (tarifaHora: number) => Promise<AuthUser>;
  actualizarTema: (tema: TemaUsuario) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authApi.obtenerUsuarioActual();
      } catch (err) {
        // Solo un 401 significa "no hay sesión". Un 502, un corte de red o un backend que se está
        // reiniciando no son "sin sesión": si se tratan así, el usuario queda como deslogueado
        // (y se le manda a /login) durante los 5 minutos que se cachea el resultado.
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    // Los fallos que no son 401 se reintentan (la carga queda en "Cargando…" mientras tanto).
    retry: (intentos, err) => !(err instanceof ApiError && err.status === 401) && intentos < 3,
    retryDelay: (intento) => Math.min(500 * 2 ** intento, 4000),
    // Con la verificación de identidad pendiente se consulta de vez en cuando para
    // enterarse pronto de la decisión del admin (notificación en el menú de usuario).
    refetchInterval: (query) => (query.state.data?.estadoVerificacion === "PENDIENTE" ? 30 * 1000 : false),
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

  const dejarDeSerCuidadorMutation = useMutation({
    mutationFn: authApi.dejarDeSerCuidador,
    onSuccess: (usuario) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, usuario);
      // Las inscripciones retiradas y el contador del navbar ya no son los mismos.
      queryClient.invalidateQueries({ queryKey: ["inscripciones"] });
    },
  });

  const verificacionIdentidadMutation = useMutation({
    mutationFn: (datos: VerificacionIdentidadDatos) => authApi.enviarVerificacionIdentidad(datos),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const resultadoVistoMutation = useMutation({
    mutationFn: authApi.marcarResultadoVerificacionVisto,
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

  const verificarEmailMutation = useMutation({
    mutationFn: (codigo: string) => authApi.verificarEmail(codigo),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const actualizarHospitalesMutation = useMutation({
    mutationFn: (hospitalIds: string[]) => authApi.actualizarHospitales(hospitalIds),
    onSuccess: (hospitalesTrabajo) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, (actual: AuthUser | null | undefined) =>
        actual ? { ...actual, hospitalesTrabajo } : actual,
      );
    },
  });

  const actualizarTarifaHoraMutation = useMutation({
    mutationFn: (tarifaHora: number) => authApi.actualizarTarifaHora(tarifaHora),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
  });

  const actualizarTemaMutation = useMutation({
    mutationFn: (tema: TemaUsuario) => authApi.actualizarTema(tema),
    onSuccess: (usuario) => queryClient.setQueryData(AUTH_QUERY_KEY, usuario),
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
        dejarDeSerCuidador: () => dejarDeSerCuidadorMutation.mutateAsync(),
        enviarVerificacionIdentidad: (datos) => verificacionIdentidadMutation.mutateAsync(datos),
        marcarResultadoVerificacionVisto: () => resultadoVistoMutation.mutateAsync(),
        obtenerStripeOnboardingLink: () => authApi.obtenerStripeOnboardingLink(),
        sincronizarStripe: () => sincronizarStripeMutation.mutateAsync(),
        cambiarContrasena: (actual, nueva) => cambiarContrasenaMutation.mutateAsync({ actual, nueva }),
        verificarEmail: (codigo) => verificarEmailMutation.mutateAsync(codigo),
        reenviarVerificacionEmail: () => authApi.reenviarVerificacionEmail(),
        actualizarHospitales: (hospitalIds) => actualizarHospitalesMutation.mutateAsync(hospitalIds),
        actualizarTarifaHora: (tarifaHora) => actualizarTarifaHoraMutation.mutateAsync(tarifaHora),
        actualizarTema: (tema) => actualizarTemaMutation.mutateAsync(tema),
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
