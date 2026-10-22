const HORA_MS = 3_600_000;

type Quien = "cuidador" | "tercero";

/**
 * Texto con el tiempo que le queda al cuidador para aportar su version de una incidencia
 * (pasado el plazo se cierra a favor de la familia). Solo horas, nunca minutos: con menos de
 * una hora dice "menos de 1 hora", y se redondea hacia abajo.
 *  - "cuidador": se lo dice a el ("Te quedan 30 horas...").
 *  - "tercero": lo lee la familia o un admin ("Al cuidador le quedan 30 horas...").
 */
export function textoPlazoRespuesta(limiteIso: string, ahora: number, quien: Quien): string {
  const resto = new Date(limiteIso).getTime() - ahora;
  const propio = quien === "cuidador";

  if (resto <= 0) {
    return propio
      ? "Tu plazo para aportar tu versión ha terminado: la incidencia se cerrará en breve."
      : "El plazo del cuidador para aportar su versión ha terminado: la incidencia se cerrará en breve.";
  }

  const horas = Math.floor(resto / HORA_MS);
  if (horas < 1) {
    return propio
      ? "Te queda menos de 1 hora para aportar tu versión."
      : "Al cuidador le queda menos de 1 hora para aportar su versión.";
  }
  if (horas === 1) {
    return propio ? "Te queda 1 hora para aportar tu versión." : "Al cuidador le queda 1 hora para aportar su versión.";
  }
  return propio
    ? `Te quedan ${horas} horas para aportar tu versión.`
    : `Al cuidador le quedan ${horas} horas para aportar su versión.`;
}
