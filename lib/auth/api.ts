import { apiFetch } from "@/lib/api/client";
import type { Hospital } from "@/lib/mock/hospitales";

export type UserRole = "USUARIO" | "CUIDADOR" | "ADMIN";
export type UserEstado = "pendiente" | "activo" | "suspendido" | "baja";

export type { TipoDocumento } from "@/lib/documento";
import type { TipoDocumento } from "@/lib/documento";

export type TemaUsuario = "SYSTEM" | "LIGHT" | "DARK";

/** Estado de la verificación de identidad (solo aplica a cuidadores). */
export type EstadoVerificacion = "SIN_SOLICITAR" | "PENDIENTE" | "RECHAZADA" | "APROBADA";

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
  estadoVerificacion: EstadoVerificacion;
  /** El admin ya ha aprobado/rechazado la solicitud y el cuidador aún no lo ha visto (notificación). */
  verificacionResultadoPendiente: boolean;
  stripeCobrosHabilitados: boolean | null;
  /** Cuidador con dinero retenido que no puede recibir hasta completar los datos de cobro. */
  cobrosPendientes: boolean;
  proveedorAuth: "LOCAL" | "GOOGLE";
  hospitalesTrabajo: Hospital[] | null;
  tarifaHora: number | null;
  tema: TemaUsuario;
  /** Hasta verificar el email no puede crear anuncios, inscribirse ni pagar. */
  emailVerificado: boolean;
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

export interface VerificacionIdentidadDatos {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  anverso: File;
  reverso: File;
  selfie: File;
}

export function enviarVerificacionIdentidad(datos: VerificacionIdentidadDatos) {
  const formulario = new FormData();
  formulario.append("tipoDocumento", datos.tipoDocumento);
  formulario.append("numeroDocumento", datos.numeroDocumento);
  formulario.append("anverso", datos.anverso);
  formulario.append("reverso", datos.reverso);
  formulario.append("selfie", datos.selfie);
  return apiFetch<UsuarioActual>("/api/usuarios/me/verificacion-identidad", {
    method: "POST",
    body: formulario,
  });
}

/** El cuidador ha abierto su perfil: da por visto el resultado de su verificación. */
export function marcarResultadoVerificacionVisto() {
  return apiFetch<UsuarioActual>("/api/usuarios/me/verificacion-identidad/visto", { method: "POST" });
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

/** Confirma el email con el código de 6 dígitos que llega por correo. */
export function verificarEmail(codigo: string) {
  return apiFetch<UsuarioActual>("/api/usuarios/me/verificar-email", {
    method: "POST",
    body: JSON.stringify({ codigo }),
  });
}

export function reenviarVerificacionEmail() {
  return apiFetch<void>("/api/usuarios/me/reenviar-verificacion", { method: "POST" });
}

/** Responde igual exista o no la cuenta: no revela quién está registrado. */
export function solicitarRecuperacionContrasena(email: string) {
  return apiFetch<void>("/api/auth/recuperar", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function restablecerContrasena(token: string, nueva: string) {
  return apiFetch<void>("/api/auth/restablecer", {
    method: "POST",
    body: JSON.stringify({ token, nueva }),
  });
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

export function actualizarTarifaHora(tarifaHora: number) {
  return apiFetch<UsuarioActual>("/api/usuarios/me/tarifa-hora", {
    method: "PATCH",
    body: JSON.stringify({ tarifaHora }),
  });
}

export function actualizarTema(tema: TemaUsuario) {
  return apiFetch<UsuarioActual>("/api/usuarios/me/tema", {
    method: "PATCH",
    body: JSON.stringify({ tema }),
  });
}
