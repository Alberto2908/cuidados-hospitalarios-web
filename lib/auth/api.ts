import { apiFetch } from "@/lib/api/client";
import type { Hospital } from "@/lib/mock/hospitales";

export type UserRole = "USUARIO" | "CUIDADOR" | "ADMIN";
export type UserEstado = "pendiente" | "activo" | "suspendido" | "baja";

export type TipoDocumento = "DNI" | "NIE" | "NIF";

export interface UsuarioActual {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  rol: UserRole;
  estado: UserEstado;
  tipoDocumento: TipoDocumento | null;
  numeroDocumento: string | null;
  documentoVerificado: boolean;
  stripeCobrosHabilitados: boolean | null;
  proveedorAuth: "LOCAL" | "GOOGLE";
  hospitalesTrabajo: Hospital[] | null;
}

export interface RegistroDatos {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
}

export interface ActualizarPerfilDatos {
  nombre: string;
  apellidos: string;
  telefono?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
}

export function obtenerUsuarioActual() {
  return apiFetch<UsuarioActual>("/api/auth/me");
}

export function login(email: string, password: string) {
  return apiFetch<UsuarioActual>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registrar(datos: RegistroDatos) {
  return apiFetch<UsuarioActual>("/api/auth/registro", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function loginConGoogle(idToken: string) {
  return apiFetch<UsuarioActual>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export function cerrarSesion() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

export function actualizarPerfil(datos: ActualizarPerfilDatos) {
  return apiFetch<UsuarioActual>("/api/usuarios/me", {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function convertirseCuidador() {
  return apiFetch<UsuarioActual>("/api/usuarios/me/convertirse-cuidador", { method: "POST" });
}

export function obtenerStripeOnboardingLink() {
  return apiFetch<{ url: string }>("/api/usuarios/me/stripe/onboarding-link", { method: "POST" });
}

export function sincronizarStripe() {
  return apiFetch<UsuarioActual>("/api/usuarios/me/stripe/sincronizar", { method: "POST" });
}

export function cambiarContrasena(actual: string, nueva: string) {
  return apiFetch<void>("/api/usuarios/me/contrasena", {
    method: "POST",
    body: JSON.stringify({ actual, nueva }),
  });
}

export function actualizarHospitales(hospitalIds: string[]) {
  return apiFetch<Hospital[]>("/api/usuarios/me/hospitales", {
    method: "PATCH",
    body: JSON.stringify({ hospitalIds }),
  });
}
