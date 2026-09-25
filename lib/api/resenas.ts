import { API_BASE_URL } from "@/lib/api/config";
import { apiFetch } from "@/lib/api/client";

export interface Resena {
  id: string;
  autorNombre: string;
  valoracion: number;
  comentario: string;
  creadoEn: string;
}

// Publico, sin autenticar (misma ficha de detalle que /api/cuidadores/{id},
// ver lib/api/cuidadores.ts).
export async function fetchResenasCuidador(cuidadorId: string): Promise<Resena[]> {
  const response = await fetch(`${API_BASE_URL}/api/cuidadores/${cuidadorId}/resenas`);
  if (!response.ok) {
    throw new Error(`Error al cargar las reseñas (${response.status})`);
  }
  return response.json() as Promise<Resena[]>;
}

interface ResenaCreadaApi {
  id: string;
  servicioId: string;
  valoracion: number;
  comentario: string | null;
  creadoEn: string;
}

// Solo el paciente/familiar del servicio, y solo si esta 'completado' y
// todavia no tiene reseña (ver ResenaService.crear en el backend, que es
// quien de verdad lo exige -esto es solo para no dejar mandar un formulario
// que el servidor va a rechazar).
export function crearResena(servicioId: string, valoracion: number, comentario?: string): Promise<ResenaCreadaApi> {
  return apiFetch<ResenaCreadaApi>(`/api/servicios/${servicioId}/resena`, {
    method: "POST",
    body: JSON.stringify({ valoracion, comentario: comentario?.trim() || null }),
  });
}
