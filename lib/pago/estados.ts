import type { EstadoPago, EstadoServicio } from "@/lib/api/servicios";

// Textos y colores del panel de pagos: siempre con palabras llanas, sin jerga de Stripe.

export const ESTADO_PAGO_ADMIN_LABEL: Record<EstadoPago, string> = {
  pendiente: "Sin pagar",
  procesado: "Dinero retenido",
  liberado: "Entregado al cuidador",
  reembolsado: "Devuelto a la familia",
  fallido: "Pago fallido",
};

export const ESTADO_PAGO_ADMIN_COLOR: Record<EstadoPago, string> = {
  pendiente: "bg-muted text-muted-foreground",
  procesado: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  liberado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  reembolsado: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  fallido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export const ESTADO_SERVICIO_ADMIN_LABEL: Record<EstadoServicio, string> = {
  aceptado: "Aceptado, sin pagar",
  confirmado: "En marcha",
  pendiente_confirmacion: "Pendiente de confirmar",
  completado: "Completado",
  cancelado: "Cancelado",
};

export const ESTADO_SERVICIO_ADMIN_COLOR: Record<EstadoServicio, string> = {
  aceptado: "bg-muted text-muted-foreground",
  confirmado: "bg-muted text-muted-foreground",
  pendiente_confirmacion: "bg-muted text-muted-foreground",
  completado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export const MOTIVO_TITULO: Record<string, string> = {
  CANCELACION_TARDIA: "Cancelado con el pago hecho",
  SIN_CONFIRMAR: "Nadie ha confirmado el cuidado",
  CUIDADOR_SIN_ALTA: "El cuidador no puede cobrar todavía",
  INCIDENCIA_FAMILIA: "La familia ha abierto una incidencia",
};

/** Frases hechas para rellenar rapido el motivo de una decision. */
export const NOTAS_RAPIDAS = [
  "El cuidador no se presentó",
  "El cuidado se realizó correctamente",
  "La familia terminó el cuidado antes de tiempo",
  "El cuidador se fue antes de lo acordado",
  "Acuerdo entre la familia y el cuidador",
];
