const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 -> "1234,50 €". Los importes siempre se muestran con dos decimales. */
export function formatearEuros(importe: number): string {
  return formatoEuros.format(importe);
}
