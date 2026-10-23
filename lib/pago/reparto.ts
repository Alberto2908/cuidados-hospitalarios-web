// Calculo del reparto de un pago retenido para la vista previa del panel de admin.
// Replica lo que hace el backend (PagoService): la comision se aplica sobre lo
// que NO se devuelve a la familia y se redondea a centimos.

export interface Reparto {
  /** Lo que vuelve a la familia. */
  familia: number;
  /** Lo que recibe el cuidador, ya descontada la comision. */
  cuidador: number;
  /** Lo que se queda la plataforma. */
  comision: number;
}

export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** `retenido` = dinero retenido; `reembolso` = parte que se devuelve a la familia. */
export function calcularReparto(retenido: number, reembolso: number, comisionPorcentaje: number): Reparto {
  const familia = redondear(Math.min(Math.max(reembolso, 0), retenido));
  const bruto = redondear(retenido - familia);
  const comision = redondear((bruto * comisionPorcentaje) / 100);
  return { familia, cuidador: redondear(bruto - comision), comision };
}

/** Reembolso que corresponde si el cuidador solo cobra las horas realmente trabajadas. */
export function reembolsoPorHoras(retenido: number, horasTrabajadas: number, precioHora: number): number {
  const aCuidador = redondear(Math.max(horasTrabajadas, 0) * precioHora);
  return redondear(Math.max(retenido - aCuidador, 0));
}
