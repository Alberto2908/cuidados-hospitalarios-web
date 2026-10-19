import { apiFetch } from "@/lib/api/client";
import type { EstadoPago, EstadoServicio, Tramo } from "@/lib/api/servicios";

// Panel de pagos del admin (ver AdminPagoController en el backend).

export type FiltroPagos = "atencion" | "retenidos" | "todos";

/** Por que un pago retenido necesita una decision del admin; el texto ya viene redactado. */
export interface MotivoPago {
  codigo: "CANCELACION_TARDIA" | "SIN_CONFIRMAR" | "CUIDADOR_SIN_ALTA" | "INCIDENCIA_FAMILIA";
  texto: string;
}

export interface PagosResumen {
  /** Cobrado y todavia en la plataforma: aun no es del cuidador. */
  retenido: number;
  entregadoCuidadores: number;
  devueltoFamilias: number;
  comisiones: number;
  requierenAtencion: number;
  retenidos: number;
}

export interface PagoFila {
  servicioId: string;
  anuncioId: string;
  anuncioTitulo: string;
  pacienteNombre: string;
  cuidadorNombre: string;
  importeTotal: number;
  importeRetenido: number;
  estado: EstadoServicio;
  estadoPago: EstadoPago;
  fechaFinPrevista: string;
  pagadoEn: string | null;
  motivos: MotivoPago[];
}

export interface PagoDetalle {
  servicioId: string;
  anuncioId: string;
  anuncioTitulo: string;
  pacienteUsuarioId: string;
  pacienteNombre: string;
  pacienteEmail: string | null;
  pacienteTelefono: string | null;
  cuidadorUsuarioId: string;
  cuidadorNombre: string;
  cuidadorEmail: string | null;
  cuidadorTelefono: string | null;
  cuidadorPuedeRecibir: boolean;
  precioHoraAcordado: number;
  horasTotales: number;
  importeTotal: number;
  importeRetenido: number;
  importeCuidador: number | null;
  importeComision: number | null;
  importeReembolsado: number;
  comisionPorcentaje: number;
  estado: EstadoServicio;
  estadoPago: EstadoPago;
  canceladoPor: "paciente" | "cuidador" | "sistema" | null;
  motivoCancelacion: string | null;
  cancelacionTardia: boolean;
  fechaFinPrevista: string;
  pagadoEn: string | null;
  liberadoEn: string | null;
  canceladoEn: string | null;
  puedeResolver: boolean;
  motivos: MotivoPago[];
  tramos: Tramo[];
  resolucionEn: string | null;
  resolucionPor: string | null;
  resolucionNota: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  /** Incidencia abierta por la familia, con la version del cuidador si la ha aportado. */
  incidencia: IncidenciaAdmin | null;
}

export interface IncidenciaAdmin {
  motivo: "no_se_presento" | "se_fue_antes" | "otro";
  descripcion: string;
  abiertaEn: string;
  respuestaCuidador: string | null;
  respuestaEn: string | null;
}

export function fetchPagosResumen(): Promise<PagosResumen> {
  return apiFetch<PagosResumen>("/api/admin/pagos/resumen");
}

/** Burbuja del menu de admin: pagos que necesitan una decision. */
export function fetchPagosConteo(): Promise<{ total: number }> {
  return apiFetch<{ total: number }>("/api/admin/pagos/conteo");
}

export function fetchPagos(filtro: FiltroPagos): Promise<PagoFila[]> {
  return apiFetch<PagoFila[]>(`/api/admin/pagos?filtro=${filtro}`);
}

export function fetchPagoDetalle(servicioId: string): Promise<PagoDetalle> {
  return apiFetch<PagoDetalle>(`/api/admin/pagos/${servicioId}`);
}

/**
 * Reparte el dinero retenido: `importeReembolso` vuelve a la familia y el resto
 * va al cuidador, menos la comision. La nota (5-500 caracteres) queda guardada
 * como constancia de por que se decidio asi.
 */
export function resolverPago(
  servicioId: string,
  datos: { importeReembolso: number; nota: string },
): Promise<PagoDetalle> {
  return apiFetch<PagoDetalle>(`/api/admin/pagos/${servicioId}/resolver`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
