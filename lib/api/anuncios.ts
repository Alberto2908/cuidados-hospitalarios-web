import { API_BASE_URL } from "@/lib/api/config";
import { apiFetch } from "@/lib/api/client";
import type { Hospital } from "@/lib/mock/hospitales";
import type { FranjaHoraria } from "@/lib/anuncio/schema";

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

interface FranjaApi {
  fecha: string;
  horaDesde: string;
  horaHasta: string;
  diaEntero: boolean;
}

function toFranja(f: FranjaApi): FranjaHoraria {
  return { fecha: f.fecha, horaDesde: f.horaDesde.slice(0, 5), horaHasta: f.horaHasta.slice(0, 5), diaEntero: f.diaEntero };
}

export type EstadoAnuncio = "activo" | "cubierto" | "cancelado";

export interface Anuncio {
  id: string;
  usuarioId: string;
  hospital: Hospital;
  titulo: string;
  descripcion: string;
  pacienteNombre: string;
  estado: EstadoAnuncio;
  /** null en el listado publico; solo viene relleno en el detalle. */
  franjas: FranjaHoraria[] | null;
  /** Datos privados: null salvo que el que consulta sea el autor o el cuidador aceptado. */
  planta: string | null;
  habitacion: string | null;
  cama: string | null;
  creadoEn: string;
}

interface AnuncioApi {
  id: string;
  usuarioId: string;
  hospital: HospitalApi;
  titulo: string;
  descripcion: string;
  pacienteNombre: string;
  estado: EstadoAnuncio;
  franjas: FranjaApi[] | null;
  planta: string | null;
  habitacion: string | null;
  cama: string | null;
  creadoEn: string;
}

function toAnuncio(a: AnuncioApi): Anuncio {
  return {
    ...a,
    hospital: toHospital(a.hospital),
    franjas: a.franjas ? a.franjas.map(toFranja) : null,
  };
}

export interface PaginaAnuncios {
  content: Anuncio[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

async function apiGetPublico<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Error al cargar ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function hospitalIdsParams(hospitalIds: string[]): URLSearchParams {
  const params = new URLSearchParams();
  hospitalIds.forEach((id) => params.append("hospitalIds", id));
  return params;
}

/** Siempre paginado, igual que /api/cuidadores (ver TODO.md, escalabilidad). */
export async function fetchAnunciosPorHospitales(
  hospitalIds: string[],
  page = 0,
  size = 20,
): Promise<PaginaAnuncios> {
  if (hospitalIds.length === 0) {
    return { content: [], page: 0, size, totalElements: 0, totalPages: 0 };
  }
  const params = hospitalIdsParams(hospitalIds);
  params.set("page", String(page));
  params.set("size", String(size));
  const pagina = await apiGetPublico<{
    content: AnuncioApi[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }>(`/api/anuncios?${params}`);
  return { ...pagina, content: pagina.content.map(toAnuncio) };
}

/** Solo cuenta (para los numeros de los marcadores del mapa), nunca trae anuncios. */
export async function fetchConteoAnunciosPorHospitales(hospitalIds: string[]): Promise<Record<string, number>> {
  if (hospitalIds.length === 0) return {};
  const params = hospitalIdsParams(hospitalIds);
  return apiGetPublico<Record<string, number>>(`/api/anuncios/conteo?${params}`);
}

// apiFetch (no apiGetPublico) a proposito: envia la cookie de sesion, asi el
// backend puede revelar planta/habitacion/cama cuando quien mira es el autor
// o el cuidador con la postulacion aceptada.
export async function obtenerAnuncio(id: string): Promise<Anuncio> {
  const data = await apiFetch<AnuncioApi>(`/api/anuncios/${id}`);
  return toAnuncio(data);
}

export interface CrearAnuncioPayload {
  titulo: string;
  descripcion: string;
  hospitalId: string;
  planta?: string;
  habitacion?: string;
  cama?: string;
  franjas: FranjaHoraria[];
}

export async function crearAnuncio(payload: CrearAnuncioPayload): Promise<Anuncio> {
  const data = await apiFetch<AnuncioApi>("/api/anuncios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toAnuncio(data);
}

export function cancelarAnuncio(id: string, motivo?: string) {
  return apiFetch<void>(`/api/anuncios/${id}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
