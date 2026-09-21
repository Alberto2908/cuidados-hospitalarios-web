import { apiFetch } from "@/lib/api/client";

export type EstadoServicio = "en_curso" | "pendiente_confirmacion" | "confirmado" | "pagado" | "cancelado";
export type EstadoPago = "pendiente" | "procesado" | "fallido";
export type CanceladoPor = "paciente" | "cuidador" | "sistema";

export interface Servicio {
  id: string;
  anuncioId: string;
  anuncioTitulo: string;
  pacienteUsuarioId: string;
  pacienteNombre: string;
  cuidadorUsuarioId: string;
  cuidadorNombre: string;
  precioHoraAcordado: number;
  horasTotales: number;
  importeTotal: number;
  fechaFinPrevista: string;
  estado: EstadoServicio;
  valoracion: number | null;
  comentarioValoracion: string | null;
  estadoPago: EstadoPago;
  canceladoPor: CanceladoPor | null;
  motivoCancelacion: string | null;
  cancelacionTardia: boolean;
  confirmadoEn: string | null;
  canceladoEn: string | null;
}

export function obtenerServicio(id: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}`);
}

export function misServicios(rol: "paciente" | "cuidador"): Promise<Servicio[]> {
  return apiFetch<Servicio[]>(`/api/servicios/mios?rol=${rol}`);
}

export function confirmarServicio(id: string, valoracion?: number, comentario?: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/confirmar`, {
    method: "POST",
    body: JSON.stringify({ valoracion, comentario }),
  });
}

export function cancelarServicio(id: string, motivo?: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
