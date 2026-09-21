/**
 * Formato de fecha unico para toda la app: DD-MM-AAAA (decision explicita,
 * nunca AAAA-MM-DD ni DD/MM/AAAA). Acepta tanto "2026-09-30" (solo fecha,
 * como llegan las franjas del backend) como un ISO datetime completo
 * ("2026-09-30T10:00:00Z", como creadoEn/fechaInicioPrevista).
 */
export function formatearFecha(fechaIso: string): string {
  const soloFecha = fechaIso.slice(0, 10);
  const [anio, mes, dia] = soloFecha.split("-");
  return `${dia}-${mes}-${anio}`;
}
