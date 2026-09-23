import { apiFetch } from "@/lib/api/client";
import type { EstadoServicio, Servicio } from "@/lib/api/servicios";
import type { Hospital } from "@/lib/mock/hospitales";

export type EstadoPostulacion = "pendiente" | "rechazada" | "retirada" | "aceptada";
export type PropuestoPor = "cuidador" | "paciente";
export type SeccionMiPostulacion = "activo" | "historial";

export interface Postulacion {
  id: string;
  anuncioId: string;
  cuidadorUsuarioId: string;
  cuidadorNombre: string;
  precioHora: number;
  propuestoPor: PropuestoPor;
  estado: EstadoPostulacion;
  /** Quien propone un precio lo acepta implicitamente: estos dos flags reflejan el consentimiento de cada parte. */
  aceptadoPorCuidador: boolean;
  aceptadoPorPaciente: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

// Sin precioHora: la tarifa de partida es la que el cuidador tiene fijada
// en su perfil (decision explicita, no se elige caso por caso al postularse).
export function postularse(anuncioId: string): Promise<Postulacion> {
  return apiFetch<Postulacion>(`/api/anuncios/${anuncioId}/postulaciones`, { method: "POST" });
}

export function listarPostulacionesPorAnuncio(anuncioId: string): Promise<Postulacion[]> {
  return apiFetch<Postulacion[]>(`/api/anuncios/${anuncioId}/postulaciones`);
}

export function listarMisPostulaciones(): Promise<Postulacion[]> {
  return apiFetch<Postulacion[]>("/api/postulaciones/mias");
}

interface HospitalApi {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  lat: number;
  lng: number;
  telefono?: string | null;
  email?: string | null;
}

function toHospital(h: HospitalApi): Hospital {
  return {
    id: h.id,
    nombre: h.nombre,
    direccion: h.direccion,
    ciudad: h.ciudad,
    provincia: h.provincia,
    codigoPostal: h.codigoPostal,
    lat: Number(h.lat),
    lng: Number(h.lng),
  };
}

export interface MiPostulacion {
  id: string;
  anuncioId: string;
  anuncioTitulo: string;
  hospital: Hospital;
  precioHora: number;
  propuestoPor: PropuestoPor;
  estado: EstadoPostulacion;
  aceptadoPorCuidador: boolean;
  aceptadoPorPaciente: boolean;
  seccion: SeccionMiPostulacion;
  estadoServicio: EstadoServicio | null;
  /** Pago ya procesado/retenido y todavía no visto — ver TODO.md (aviso solo tras el cobro real, no al aceptar). */
  nuevoServicioAceptado: boolean;
  creadoEn: string;
}

interface MiPostulacionApi extends Omit<MiPostulacion, "hospital"> {
  hospital: HospitalApi;
}

/** Postulaciones propias del cuidador: activas arriba, historial debajo (ver /cuidador/historial). */
export async function misPostulacionesConSeccion(): Promise<MiPostulacion[]> {
  const data = await apiFetch<MiPostulacionApi[]>("/api/postulaciones/mias/historial");
  return data.map((p) => ({ ...p, hospital: toHospital(p.hospital) }));
}

/** Contraoferta: la puede mandar tanto el cuidador como el autor del anuncio. */
export function actualizarPrecioPostulacion(id: string, precioHora: number): Promise<Postulacion> {
  return apiFetch<Postulacion>(`/api/postulaciones/${id}/precio`, {
    method: "PATCH",
    body: JSON.stringify({ precioHora }),
  });
}

export function aceptarPostulacion(id: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/postulaciones/${id}/aceptar`, { method: "POST" });
}

export function rechazarPostulacion(id: string): Promise<void> {
  return apiFetch<void>(`/api/postulaciones/${id}/rechazar`, { method: "POST" });
}

export function retirarPostulacion(id: string): Promise<void> {
  return apiFetch<void>(`/api/postulaciones/${id}/retirar`, { method: "POST" });
}

/** Badge del navbar (cuidador): contraofertas del paciente que esperan su respuesta. */
export function misNotificacionesConteo(): Promise<{ total: number }> {
  return apiFetch<{ total: number }>("/api/postulaciones/mias/notificaciones-conteo");
}

/**
 * Etiqueta del estado de una postulacion vista desde un lado concreto
 * (cuidador o paciente/familiar): quien propone un precio lo acepta
 * implicitamente, la otra parte tiene que aceptarlo tambien para pasar a
 * "aceptada" -> mientras tanto se distingue de quien es la aceptacion
 * pendiente, en vez de un generico "Pendiente" o "Aceptada" que no dice nada
 * de en que punto de la negociacion esta cada uno.
 */
export function etiquetaEstadoPostulacion(
  postulacion: Pick<Postulacion, "estado" | "aceptadoPorCuidador" | "aceptadoPorPaciente">,
  viendoComoCuidador: boolean,
): string {
  if (postulacion.estado === "rechazada") return "Rechazada";
  if (postulacion.estado === "retirada") return "Retirada";
  if (postulacion.estado === "aceptada") return "Aceptado por ambas partes";

  const miAceptacion = viendoComoCuidador ? postulacion.aceptadoPorCuidador : postulacion.aceptadoPorPaciente;
  const otraAceptacion = viendoComoCuidador ? postulacion.aceptadoPorPaciente : postulacion.aceptadoPorCuidador;
  if (miAceptacion && !otraAceptacion) return "Aceptado por tu parte";
  if (otraAceptacion && !miAceptacion) return "Aceptado por la otra parte";
  return "Pendiente";
}
