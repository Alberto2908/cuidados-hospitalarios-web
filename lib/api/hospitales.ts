import { API_BASE_URL } from "@/lib/api/config";
import type { Hospital } from "@/lib/mock/hospitales";

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

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Error al cargar ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
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

export function fetchProvincias(): Promise<string[]> {
  return apiGet<string[]>("/api/hospitales/provincias");
}

export async function fetchHospitalesPorProvincia(
  provincia: string,
): Promise<Hospital[]> {
  const encoded = encodeURIComponent(provincia);
  const data = await apiGet<HospitalApi[]>(
    `/api/hospitales?provincia=${encoded}`,
  );
  return data.map(toHospital);
}
