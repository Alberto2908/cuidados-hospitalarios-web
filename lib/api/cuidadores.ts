import { API_BASE_URL } from "@/lib/api/config";
import type { Hospital } from "@/lib/mock/hospitales";

// especialidad/experienciaAnios/valoracion NO existen todavia en el backend
// real (ver TODO.md, "Ampliar perfil_cuidador") -> este tipo solo trae lo
// que el servidor de verdad tiene. Los valores de relleno se aplican en el
// componente que consume esto, nunca aqui.
export interface CuidadorPublico {
  id: string;
  nombre: string;
  apellidos: string;
  hospitales: Hospital[];
}

export interface PaginaCuidadores {
  content: CuidadorPublico[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

async function apiGet<T>(path: string): Promise<T> {
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

/**
 * Siempre paginado: con miles de cuidadores en un mismo hospital esto no
 * puede traerlos todos de golpe (ver TODO.md, escalabilidad del buscador).
 */
export function fetchCuidadoresPorHospitales(
  hospitalIds: string[],
  page = 0,
  size = 20,
): Promise<PaginaCuidadores> {
  if (hospitalIds.length === 0) {
    return Promise.resolve({ content: [], page: 0, size, totalElements: 0, totalPages: 0 });
  }
  const params = hospitalIdsParams(hospitalIds);
  params.set("page", String(page));
  params.set("size", String(size));
  return apiGet<PaginaCuidadores>(`/api/cuidadores?${params}`);
}

/** Solo cuenta (para los numeros de los marcadores del mapa), nunca trae cuidadores. */
export async function fetchConteoCuidadoresPorHospitales(
  hospitalIds: string[],
): Promise<Record<string, number>> {
  if (hospitalIds.length === 0) return {};
  const params = hospitalIdsParams(hospitalIds);
  return apiGet<Record<string, number>>(`/api/cuidadores/conteo?${params}`);
}
