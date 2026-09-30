import { apiFetch } from "@/lib/api/client";
import type { EstadoServicio, Servicio } from "@/lib/api/servicios";
import type { Hospital } from "@/lib/mock/hospitales";

export type EstadoInscripcion = "pendiente" | "rechazada" | "retirada" | "aceptada";
export type PropuestoPor = "cuidador" | "paciente";
export type SeccionMiInscripcion = "activo" | "historial";

export interface Inscripcion {
  id: string;
  anuncioId: string;
  cuidadorUsuarioId: string;
  cuidadorNombre: string;
  precioHora: number;
  propuestoPor: PropuestoPor;
  estado: EstadoInscripcion;
  /** Quien propone un precio lo acepta implicitamente: estos dos flags reflejan el consentimiento de cada parte. */
  aceptadoPorCuidador: boolean;
  aceptadoPorPaciente: boolean;
  /** Id del servicio creado al aceptar (null si sigue pendiente/rechazada/retirada). */
  servicioId: string | null;
  /** Estado del servicio creado al aceptar (null si sigue pendiente/rechazada/retirada). estado se queda en "aceptada" para siempre, este campo es el que avanza (ver V12). */
  estadoServicio: EstadoServicio | null;
  /** Si el servicio ya tiene una reseña puesta (solo puede haber una). */
  tieneResena: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

// Sin precioHora: la tarifa de partida es la que el cuidador tiene fijada
// en su perfil (decision explicita, no se elige caso por caso al inscribirse).
export function inscribirse(anuncioId: string): Promise<Inscripcion> {
  return apiFetch<Inscripcion>(`/api/anuncios/${anuncioId}/inscripciones`, { method: "POST" });
}

export function listarInscripcionesPorAnuncio(anuncioId: string): Promise<Inscripcion[]> {
  return apiFetch<Inscripcion[]>(`/api/anuncios/${anuncioId}/inscripciones`);
}

export function listarMisInscripciones(): Promise<Inscripcion[]> {
  return apiFetch<Inscripcion[]>("/api/inscripciones/mias");
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

export interface MiInscripcion {
  id: string;
  anuncioId: string;
  anuncioTitulo: string;
  /** Quien publicó el anuncio (solo el nombre) y su id, para abrir su perfil (/pacientes/[id]). */
  anuncianteId: string;
  anuncianteNombre: string;
  hospital: Hospital;
  precioHora: number;
  propuestoPor: PropuestoPor;
  estado: EstadoInscripcion;
  aceptadoPorCuidador: boolean;
  aceptadoPorPaciente: boolean;
  seccion: SeccionMiInscripcion;
  estadoServicio: EstadoServicio | null;
  /** Pago ya procesado/retenido y todavía no visto — ver TODO.md (aviso solo tras el cobro real, no al aceptar). */
  nuevoServicioAceptado: boolean;
  /** La valoración que el paciente/familiar le ha puesto a este cuidador por este servicio (null si todavía no ha valorado). */
  miValoracion: number | null;
  creadoEn: string;
}

interface MiInscripcionApi extends Omit<MiInscripcion, "hospital"> {
  hospital: HospitalApi;
}

/** Inscripciones propias del cuidador: activas arriba, historial debajo (ver /cuidador/historial). */
export async function misInscripcionesConSeccion(): Promise<MiInscripcion[]> {
  const data = await apiFetch<MiInscripcionApi[]>("/api/inscripciones/mias/historial");
  return data.map((p) => ({ ...p, hospital: toHospital(p.hospital) }));
}

/** Contraoferta: la puede mandar tanto el cuidador como el autor del anuncio. */
export function actualizarPrecioInscripcion(id: string, precioHora: number): Promise<Inscripcion> {
  return apiFetch<Inscripcion>(`/api/inscripciones/${id}/precio`, {
    method: "PATCH",
    body: JSON.stringify({ precioHora }),
  });
}

export function aceptarInscripcion(id: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/inscripciones/${id}/aceptar`, { method: "POST" });
}

export function rechazarInscripcion(id: string): Promise<void> {
  return apiFetch<void>(`/api/inscripciones/${id}/rechazar`, { method: "POST" });
}

export function retirarInscripcion(id: string): Promise<void> {
  return apiFetch<void>(`/api/inscripciones/${id}/retirar`, { method: "POST" });
}

/** Badge del navbar (cuidador): contraofertas del paciente que esperan su respuesta. */
export function misNotificacionesConteo(): Promise<{ total: number }> {
  return apiFetch<{ total: number }>("/api/inscripciones/mias/notificaciones-conteo");
}

/**
 * Etiqueta del estado de una inscripcion vista desde un lado concreto
 * (cuidador o paciente/familiar): quien propone un precio lo acepta
 * implicitamente, la otra parte tiene que aceptarlo tambien para pasar a
 * "aceptada" -> mientras tanto se distingue de quien es la aceptacion
 * pendiente, en vez de un generico "Pendiente" o "Aceptada" que no dice nada
 * de en que punto de la negociacion esta cada uno.
 */
export function etiquetaEstadoInscripcion(
  inscripcion: Pick<Inscripcion, "estado" | "aceptadoPorCuidador" | "aceptadoPorPaciente">,
  viendoComoCuidador: boolean,
): string {
  if (inscripcion.estado === "rechazada") return "Rechazada";
  if (inscripcion.estado === "retirada") return "Retirada";
  if (inscripcion.estado === "aceptada") return "Aceptado por ambas partes";

  const miAceptacion = viendoComoCuidador ? inscripcion.aceptadoPorCuidador : inscripcion.aceptadoPorPaciente;
  const otraAceptacion = viendoComoCuidador ? inscripcion.aceptadoPorPaciente : inscripcion.aceptadoPorCuidador;
  if (miAceptacion && !otraAceptacion) return "Aceptado por tu parte";
  if (otraAceptacion && !miAceptacion) return "Aceptado por la otra parte";
  return "Pendiente";
}
