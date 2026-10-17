import { apiFetch } from "@/lib/api/client";

// aceptado (precio acordado, sin pago) -> confirmado (pago realizado) ->
// pendiente_confirmacion (turno terminado, esperando confirmacion) ->
// completado (el paciente confirma, o la futura auto-confirmacion) |
// cancelado. Ver V12 en el backend.
export type EstadoServicio = "aceptado" | "confirmado" | "pendiente_confirmacion" | "completado" | "cancelado";
// pendiente (sin cobrar) -> procesado (cobrado y retenido en la plataforma, aun
// no es del cuidador) -> liberado (transferido al cuidador) | reembolsado
// (devuelto a la familia) | fallido (el ultimo intento de cobro fallo).
// Ver V19 en el backend.
export type EstadoPago = "pendiente" | "procesado" | "liberado" | "reembolsado" | "fallido";
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
  /** Lo que ha recibido el cuidador (tras la comision) segun se libera el pago; null si aun nada. */
  importeCuidador: number | null;
  /** Lo que se ha devuelto a la familia. */
  importeReembolsado: number;
  /** Incidencia abierta por la familia (null si no hay): bloquea la confirmacion hasta que la revise la plataforma. */
  incidenciaAbiertaEn: string | null;
  incidenciaMotivo: MotivoIncidencia | null;
  incidenciaDescripcion: string | null;
  /** Version del cuidador sobre la incidencia (null mientras no la haya aportado). */
  incidenciaRespuestaCuidador: string | null;
  incidenciaRespuestaEn: string | null;
  /** Cuando la plataforma resolvio el reparto (null si aun no). */
  resolucionEn: string | null;
}

export type MotivoIncidencia = "no_se_presento" | "se_fue_antes" | "otro";

// Un dia de un cuidado largo: cada dia se confirma y se paga al cuidador por
// separado (ver V20 en el backend). La lista esta vacia en cuidados cortos.
export type EstadoTramo = "pendiente" | "confirmado" | "liberado" | "reembolsado";

export interface Tramo {
  id: string;
  fecha: string;
  horas: number;
  importe: number;
  estado: EstadoTramo;
  finPrevisto: string;
  /** El cuidado esta pagado, el dia ya ha terminado y sigue pendiente de confirmar. */
  confirmable: boolean;
  importeReembolsado: number;
  importeCuidador: number | null;
}

export function listarTramos(servicioId: string): Promise<Tramo[]> {
  return apiFetch<Tramo[]>(`/api/servicios/${servicioId}/tramos`);
}

export function confirmarTramo(tramoId: string): Promise<Tramo> {
  return apiFetch<Tramo>(`/api/servicios/tramos/${tramoId}/confirmar`, { method: "POST" });
}

export interface IntentoPago {
  /** Secreto con el que Stripe monta el formulario de pago (Payment Element). */
  clientSecret: string;
  importe: number;
}

// Inicia (o recupera, si ya habia uno abierto) el pago del servicio. El pago
// solo se da por hecho cuando Stripe lo avisa al backend: tras pagar hay que
// consultar el servicio hasta que estadoPago pase a "procesado".
export function iniciarPagoServicio(id: string): Promise<IntentoPago> {
  return apiFetch<IntentoPago>(`/api/servicios/${id}/pago`, { method: "POST" });
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

export function abrirIncidenciaServicio(id: string, datos: { motivo: MotivoIncidencia; descripcion: string }): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/incidencia`, { method: "POST", body: JSON.stringify(datos) });
}

export function responderIncidenciaServicio(id: string, descripcion: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/incidencia/respuesta`, { method: "POST", body: JSON.stringify({ descripcion }) });
}

export function cancelarServicio(id: string, motivo?: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/api/servicios/${id}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
