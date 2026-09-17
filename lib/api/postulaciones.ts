import { apiFetch } from "@/lib/api/client";
import type { Servicio } from "@/lib/api/servicios";

export type EstadoPostulacion = "pendiente" | "rechazada" | "retirada" | "aceptada";
export type PropuestoPor = "cuidador" | "paciente";

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
