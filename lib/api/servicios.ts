import { apiFetch } from "@/lib/api/client";

// aceptado (precio acordado, sin pago) -> confirmado (pago realizado) ->
// pendiente_confirmacion (turno terminado, esperando confirmacion) ->
// completado (el paciente confirma, o la futura auto-confirmacion) |
// cancelado. Ver V12 en el backend.
export type EstadoServicio = "aceptado" | "confirmado" | "pendiente_confirmacion" | "completado" | "cancelado";
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

// La valoracion ya no se envia aqui: vivira en un flujo de resenas aparte,
// despues de confirmar (ver lib/api/resenas.ts).
export function confirmarServicio(id: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/confirmar`, { method: "POST" });
}

export function cancelarServicio(id: string, motivo?: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
