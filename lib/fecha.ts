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

/**
 * "Antigüedad" (cuánto tiempo lleva algo, no cuándo empezó) a partir de una
 * fecha ISO: usado para "cuidador desde hace X". Redondea hacia abajo, sin
 * decimales raros ("2 meses", no "2,3 meses").
 */
export function formatearAntiguedad(fechaIso: string): string {
  const desde = new Date(fechaIso).getTime();
  const dias = Math.max(0, Math.floor((Date.now() - desde) / (1000 * 60 * 60 * 24)));

  if (dias < 30) return dias <= 1 ? "menos de 1 día" : `${dias} días`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? "1 mes" : `${meses} meses`;

  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  const textoAnios = anios === 1 ? "1 año" : `${anios} años`;
  if (mesesRestantes === 0) return textoAnios;
  return `${textoAnios} y ${mesesRestantes === 1 ? "1 mes" : `${mesesRestantes} meses`}`;
}
