import type { FranjaHoraria } from "@/lib/anuncio/schema";

/** Espejo en el frontend de FranjaCalculo.horasTotales (server): mismo redondeo, mismo tratamiento de "cruza medianoche". Solo para mostrar una estimación; el importe real siempre lo calcula el backend. */
export function horasTotales(franjas: FranjaHoraria[]): number {
  const totalMinutos = franjas.reduce((total, f) => {
    if (f.diaEntero) return total + 24 * 60;
    const [hDesde, mDesde] = f.horaDesde.split(":").map(Number);
    const [hHasta, mHasta] = f.horaHasta.split(":").map(Number);
    const desde = hDesde * 60 + mDesde;
    const hasta = hHasta * 60 + mHasta;
    const minutos = hasta <= desde ? 24 * 60 - desde + hasta : hasta - desde;
    return total + minutos;
  }, 0);
  return Math.round((totalMinutos / 60) * 100) / 100;
}

/** Minutos antes del inicio hasta los que el cuidador puede retirarse de un cuidado ya pagado (espejo de InscripcionService.MINUTOS_LIMITE_RETIRADA). */
const MINUTOS_LIMITE_RETIRADA = 30;

/** Primer instante del cuidado (como FranjaCalculo.fechaInicio del backend); null si no hay franjas. */
function inicioDelCuidado(franjas: FranjaHoraria[]): number | null {
  const inicios = franjas.map((f) => {
    const [anio, mes, dia] = f.fecha.split("-").map(Number);
    const [hora, minuto] = (f.diaEntero ? "00:00" : f.horaDesde).split(":").map(Number);
    return new Date(anio, mes - 1, dia, hora, minuto).getTime();
  });
  return inicios.length > 0 ? Math.min(...inicios) : null;
}

/** true si el cuidado ya ha empezado (o ha terminado). */
export function cuidadoEmpezado(franjas: FranjaHoraria[], ahora: number): boolean {
  const inicio = inicioDelCuidado(franjas);
  return inicio !== null && inicio <= ahora;
}

/** true mientras falten mas de 30 minutos para empezar el cuidado (`ahora` en milisegundos, p. ej. Date.now()). */
export function puedeRetirarseConPagoHecho(franjas: FranjaHoraria[], ahora: number): boolean {
  const inicio = inicioDelCuidado(franjas);
  return inicio === null || ahora < inicio - MINUTOS_LIMITE_RETIRADA * 60_000;
}

/** Ultimo instante del cuidado (como FranjaCalculo.fechaFin del backend); null si no hay franjas. */
function finDelCuidado(franjas: FranjaHoraria[]): number | null {
  const fines = franjas.map((f) => {
    const [anio, mes, dia] = f.fecha.split("-").map(Number);
    const [hDesde, mDesde] = f.horaDesde.split(":").map(Number);
    const [hHasta, mHasta] = f.horaHasta.split(":").map(Number);
    const cruzaMedianoche = f.diaEntero || hHasta * 60 + mHasta <= hDesde * 60 + mDesde;
    const [hora, minuto] = f.diaEntero ? [0, 0] : [hHasta, mHasta];
    return new Date(anio, mes - 1, dia + (cruzaMedianoche ? 1 : 0), hora, minuto).getTime();
  });
  return fines.length > 0 ? Math.max(...fines) : null;
}

/** true si el cuidado ya ha empezado y todavia no ha terminado. */
export function cuidadoEnCurso(franjas: FranjaHoraria[], ahora: number): boolean {
  const inicio = inicioDelCuidado(franjas);
  const fin = finDelCuidado(franjas);
  return inicio !== null && fin !== null && inicio <= ahora && ahora < fin;
}

/** Estado que se muestra de un servicio: "confirmado" (pagado) pasa a "en_curso" mientras se esta realizando, y a "en_revision" si hay una incidencia abierta. */
export function estadoServicioMostrado<T extends string>(
  estado: T | null | undefined,
  franjas: FranjaHoraria[],
  ahora: number,
  incidenciaAbierta = false,
): T | "en_curso" | "en_revision" | null {
  if (!estado) return null;
  // Con una incidencia abierta el cuidado queda "en revision" hasta que la plataforma lo resuelva.
  if (incidenciaAbierta && (estado === "confirmado" || estado === "pendiente_confirmacion")) return "en_revision";
  return estado === "confirmado" && cuidadoEnCurso(franjas, ahora) ? "en_curso" : estado;
}

export type SeccionVisible = "en_curso" | "activo" | "historial";

/**
 * Seccion en la que se muestra un cuidado pagado segun la hora: "en curso" mientras se
 * esta realizando, y "historial" en cuanto termina (aunque el servidor tarde un minuto en
 * pasarlo a pendiente de confirmar). El resto conserva la seccion que da el backend.
 */
export function seccionVisible(
  seccionBackend: "activo" | "historial",
  estadoServicio: string | null | undefined,
  franjas: FranjaHoraria[],
  ahora: number,
): SeccionVisible {
  if (seccionBackend === "activo" && estadoServicio === "confirmado") {
    if (cuidadoEnCurso(franjas, ahora)) return "en_curso";
    const fin = finDelCuidado(franjas);
    if (fin !== null && ahora >= fin) return "historial";
  }
  return seccionBackend;
}
