import { apiFetch } from "@/lib/api/client";
import type { ItemCompletado } from "@/lib/api/cuidadores";

export interface PacientePerfil {
  id: string;
  nombre: string;
  apellidos: string;
  identidadVerificada: boolean;
  /** Fecha de alta en la app (ISO datetime), para calcular la antigüedad. */
  miembroDesde: string;
  anunciosPublicados: number;
  anunciosCompletados: number;
  ultimosAnunciosCompletados: ItemCompletado[];
}

/** Perfil público de un paciente/familiar. Exige sesión iniciada. */
export function fetchPacientePerfil(id: string): Promise<PacientePerfil> {
  return apiFetch<PacientePerfil>(`/api/pacientes/${id}`);
}
