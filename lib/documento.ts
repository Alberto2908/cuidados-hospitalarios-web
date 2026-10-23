// Misma validacion que el backend (DocumentoIdentidad.java): formato del
// numero de DNI/NIE y letra de control (modulo 23). Solo sirve para avisar al
// usuario antes de enviar; el servidor vuelve a validar.

export type TipoDocumento = "DNI" | "NIE";

export const TIPOS_DOCUMENTO: TipoDocumento[] = ["DNI", "NIE"];

const LETRAS_CONTROL = "TRWAGMYFPDXBNJZSQVHLCKE";

/** Mayúsculas y sin espacios ni guiones ("12345678-z" -> "12345678Z"). */
export function normalizarDocumento(numero: string): string {
  return numero.replace(/[\s-]/g, "").toUpperCase();
}

/** `numero` sin normalizar; se normaliza aquí. */
export function documentoValido(tipo: TipoDocumento, numero: string): boolean {
  const n = normalizarDocumento(numero);
  if (tipo === "DNI") {
    return /^\d{8}[A-Z]$/.test(n) && LETRAS_CONTROL[Number(n.slice(0, 8)) % 23] === n[8];
  }
  if (!/^[XYZ]\d{7}[A-Z]$/.test(n)) return false;
  const cuerpo = Number(`${"XYZ".indexOf(n[0])}${n.slice(1, 8)}`);
  return LETRAS_CONTROL[cuerpo % 23] === n[8];
}

export const EJEMPLO_DOCUMENTO: Record<TipoDocumento, string> = {
  DNI: "12345678Z",
  NIE: "X1234567L",
};
