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
