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
  seccion: SeccionMiPostulacion;
  estadoServicio: EstadoServicio | null;
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
