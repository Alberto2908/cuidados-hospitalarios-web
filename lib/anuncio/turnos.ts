import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { FranjaHoraria } from "@/lib/anuncio/schema";

// Un turno nunca cruza la medianoche dentro de una misma franja: la lista de
// "Hasta" llega siempre hasta las 00:00 (fin del dia) y, si el cuidado sigue,
// se elige "Continuar el dia siguiente", que crea una franja nueva desde las
// 00:00 de ese dia (la "continuacion"), con su propio "Hasta" libre. Una
// continuacion que llega a las 00:00 es un dia completo ("Día entero") y puede
// seguir al dia siguiente, asi que un cuidado puede encadenar varios dias. El
// backend ya calcula bien horas e inicio/fin con franjas de un solo dia (FranjaCalculo).

const MINUTOS_DIA = 24 * 60;
const PASO = 15;
const FIN_DE_DIA = "00:00";
/** Duracion por defecto de la continuacion que se crea al dia siguiente, y del reajuste del final al mover el inicio. */
const MINUTOS_POR_DEFECTO = 120;

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function deMinutos(total: number): string {
  const normalizado = ((total % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  const hh = String(Math.floor(normalizado / 60)).padStart(2, "0");
  const mm = String(normalizado % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function desplazarFecha(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const fechaUtc = new Date(Date.UTC(y, m - 1, d + dias));
  return fechaUtc.toISOString().slice(0, 10);
}

export function fechaSiguiente(fecha: string): string {
  return desplazarFecha(fecha, 1);
}

/** Minutos en que acaba el turno dentro de su dia (la hora "00:00" final cuenta como 24:00). */
export function minutosFinEnElDia(hasta: string): number {
  return hasta === FIN_DE_DIA ? MINUTOS_DIA : aMinutos(hasta);
}

/** Fecha local de `d` como yyyy-MM-dd. */
export function claveFecha(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Minutos desde las 00:00 (con segundos como fraccion) de la hora local de `d`. */
function minutosDeAhora(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

/**
 * Primera hora de inicio posible ese dia (en minutos): para hoy, el siguiente
 * cuarto de hora (no se puede empezar en una hora que ya paso); null si hoy ya
 * no queda ninguna. Cualquier otro dia, las 00:00.
 */
export function primerInicioPosible(fecha: string, ahora: Date): number | null {
  if (fecha !== claveFecha(ahora)) return 0;
  const primero = Math.ceil(minutosDeAhora(ahora) / PASO) * PASO;
  return primero > MINUTOS_DIA - PASO ? null : primero;
}

/** Opciones del selector "Desde": 00:00 … 23:45; hoy, las horas que ya pasaron salen deshabilitadas. */
export function opcionesDesde(fecha: string, ahora: Date): OpcionHora[] {
  const minimo = primerInicioPosible(fecha, ahora);
  const opciones: OpcionHora[] = [];
  for (let m = 0; m < MINUTOS_DIA; m += PASO) {
    opciones.push({ hora: deMinutos(m), deshabilitada: minimo === null || m < minimo });
  }
  return opciones;
}

/**
 * Turno que se propone al marcar un dia: 09:00–21:00, o, si hoy ya pasaron esas
 * horas, desde el siguiente cuarto de hora. null si hoy ya no cabe ningun turno.
 */
export function turnoPorDefecto(
  fecha: string,
  ahora: Date,
  desde = "09:00",
  hasta = "21:00",
): { horaDesde: string; horaHasta: string } | null {
  const minimo = primerInicioPosible(fecha, ahora);
  if (minimo === null) return null;
  const inicio = Math.max(aMinutos(desde), minimo);
  const fin = aMinutos(hasta) > inicio ? hasta : deMinutos(Math.min(inicio + MINUTOS_POR_DEFECTO, MINUTOS_DIA));
  return { horaDesde: deMinutos(inicio), horaHasta: fin };
}

/** "21 oct" a partir de una fecha yyyy-MM-dd. */
export function etiquetaCorta(fecha: string): string {
  return format(parse(fecha, "yyyy-MM-dd", new Date()), "d MMM", { locale: es });
}

/** "miércoles 21 oct" a partir de una fecha yyyy-MM-dd. */
export function etiquetaDia(fecha: string): string {
  return format(parse(fecha, "yyyy-MM-dd", new Date()), "EEEE d MMM", { locale: es });
}

export interface OpcionHora {
  hora: string;
  deshabilitada?: boolean;
}

/** Entrada extra al final de la lista de "Hasta": "Continuar el día siguiente". */
export interface AccionContinuar {
  etiqueta: string;
  /** Ya hay una continuacion al dia siguiente. */
  marcada: boolean;
  deshabilitada: boolean;
  /** Por que no esta disponible (si no lo esta). */
  motivo?: string;
}

function terminaEnMedianoche(f: FranjaHoraria): boolean {
  return f.diaEntero || f.horaHasta === FIN_DE_DIA;
}

function empiezaEnMedianoche(f: FranjaHoraria): boolean {
  return f.diaEntero || f.horaDesde === FIN_DE_DIA;
}

/**
 * Indice de la franja que continua la del indice `i` al dia siguiente (o -1):
 * la que empieza a las 00:00 de ese dia cuando `i` acaba a las 00:00. Dos "Día
 * entero" seguidos no cuentan (son dos dias marcados, no un turno partido).
 */
export function indiceContinuacion(franjas: FranjaHoraria[], i: number): number {
  const f = franjas[i];
  if (!f || !terminaEnMedianoche(f)) return -1;
  const siguiente = fechaSiguiente(f.fecha);
  return franjas.findIndex(
    (g, k) => k !== i && g.fecha === siguiente && empiezaEnMedianoche(g) && !(f.diaEntero && g.diaEntero),
  );
}

/** Indice de la franja de la que `j` es continuacion (o -1). */
export function indicePadre(franjas: FranjaHoraria[], j: number): number {
  const g = franjas[j];
  if (!g || !empiezaEnMedianoche(g)) return -1;
  return franjas.findIndex((_, i) => i !== j && indiceContinuacion(franjas, i) === j);
}

/**
 * Hasta donde puede llegar un turno que entra al dia siguiente a `fecha` sin
 * pisar lo que ya hay ese dia (minutos desde las 00:00): 0 si es "Día entero",
 * la hora de inicio de su primer turno, o Infinity si esta libre.
 */
function limiteDiaSiguiente(franjas: FranjaHoraria[], fecha: string): number {
  const siguiente = fechaSiguiente(fecha);
  const otros = franjas.filter((g) => g.fecha === siguiente);
  if (otros.some((g) => g.diaEntero)) return 0;
  if (otros.length === 0) return Infinity;
  return Math.min(...otros.map((g) => aMinutos(g.horaDesde)));
}

/**
 * Opciones del selector "Hasta": de 15 en 15 minutos desde el "Desde" hasta
 * las 00:00 (fin del dia). Desde las 00:00, elegir el 00:00 final es un dia
 * completo (el turno pasa a "Día entero").
 */
export function opcionesHasta(franjas: FranjaHoraria[], i: number): OpcionHora[] {
  const desde = aMinutos(franjas[i].horaDesde);
  const opciones: OpcionHora[] = [];
  for (let m = desde + PASO; m <= MINUTOS_DIA; m += PASO) {
    opciones.push({ hora: deMinutos(m) });
  }
  return opciones;
}

/** Estado de la entrada "Continuar el día siguiente" de un turno (null si no aplica). */
export function accionContinuar(franjas: FranjaHoraria[], i: number): AccionContinuar | null {
  const f = franjas[i];
  // "Día entero" no tiene selector de horas: el cuidado sigue marcando el dia siguiente.
  if (!f || f.diaEntero) return null;
  const etiqueta = `Continuar el ${etiquetaCorta(fechaSiguiente(f.fecha))}`;
  return { etiqueta, marcada: indiceContinuacion(franjas, i) >= 0, deshabilitada: false };
}

/** Pone el final de un turno a las 00:00: si empieza a las 00:00 es un dia completo ("Día entero"). */
function conFinEnMedianoche(f: FranjaHoraria): FranjaHoraria {
  return { ...f, horaHasta: FIN_DE_DIA, diaEntero: f.horaDesde === FIN_DE_DIA };
}

/** Fija la hora final del turno `i` (el 00:00 desde las 00:00 es un dia completo). */
export function aplicarHasta(franjas: FranjaHoraria[], i: number, hora: string): FranjaHoraria[] {
  return franjas.map((g, k) => {
    if (k !== i) return g;
    return hora === FIN_DE_DIA ? conFinEnMedianoche(g) : { ...g, horaHasta: hora, diaEntero: false };
  });
}

/**
 * "Continuar el día siguiente": el turno acaba a las 00:00 y se crea la
 * continuacion al dia siguiente (desde las 00:00, 2 h por defecto sin pasar de
 * lo que ya hubiera ese dia). Si ese dia ya empieza a las 00:00 (p. ej. "Día
 * entero"), no se crea nada: queda enlazado con lo que ya hay.
 */
export function continuarDiaSiguiente(franjas: FranjaHoraria[], i: number): FranjaHoraria[] {
  const f = franjas[i];
  const actualizado = franjas.map((g, k) => (k === i ? conFinEnMedianoche(g) : g));
  const limite = limiteDiaSiguiente(franjas, f.fecha);
  if (indiceContinuacion(actualizado, i) >= 0 || limite < PASO) return actualizado;

  const fin = Math.min(MINUTOS_POR_DEFECTO, limite);
  return [
    ...actualizado,
    { fecha: fechaSiguiente(f.fecha), horaDesde: FIN_DE_DIA, horaHasta: deMinutos(fin), diaEntero: false },
  ];
}

/** Fija la hora de inicio del turno `i` y, si el final ya no encaja, lo recoloca 2 h despues (sin pasar de las 00:00). */
export function aplicarDesde(franjas: FranjaHoraria[], i: number, desde: string): FranjaHoraria[] {
  const f = franjas[i];
  const inicio = aMinutos(desde);
  const encaja = minutosFinEnElDia(f.horaHasta) > inicio && !(desde === FIN_DE_DIA && f.horaHasta === FIN_DE_DIA);
  const horaHasta = encaja ? f.horaHasta : deMinutos(Math.min(inicio + MINUTOS_POR_DEFECTO, MINUTOS_DIA));
  return franjas.map((g, k) => (k === i ? { ...g, horaDesde: desde, horaHasta, diaEntero: false } : g));
}

export interface EnlaceTurno {
  /** "continua": este turno sigue el dia siguiente; "viene": es la continuacion de ayer. */
  tipo: "continua" | "viene";
  fechaOtro: string;
}

export function enlaceDe(franjas: FranjaHoraria[], i: number): EnlaceTurno | null {
  const j = indiceContinuacion(franjas, i);
  if (j >= 0) return { tipo: "continua", fechaOtro: franjas[j].fecha };
  const padre = indicePadre(franjas, i);
  if (padre >= 0) return { tipo: "viene", fechaOtro: franjas[padre].fecha };
  return null;
}

/**
 * Turnos que se quedarian a medias si se quitan los dias `fechas` (una mitad
 * se borra y la otra se queda). Sirve para avisar antes de borrar.
 */
export function turnosQueQuedanIncompletos(franjas: FranjaHoraria[], fechas: Set<string>): EnlaceTurno[] {
  const avisos: EnlaceTurno[] = [];
  franjas.forEach((f, i) => {
    const j = indiceContinuacion(franjas, i);
    if (j < 0) return;
    const quitaPadre = fechas.has(f.fecha);
    const quitaContinuacion = fechas.has(franjas[j].fecha);
    // El aviso habla del turno que se borra: si es el de hoy, "continúa" el día
    // siguiente; si es la continuación, "viene" del día anterior.
    if (quitaPadre && !quitaContinuacion) avisos.push({ tipo: "continua", fechaOtro: franjas[j].fecha });
    if (!quitaPadre && quitaContinuacion) avisos.push({ tipo: "viene", fechaOtro: f.fecha });
  });
  return avisos;
}

function hayContinuidad(franjas: FranjaHoraria[], i: number, j: number): boolean {
  const a = franjas[i];
  const b = franjas[j];
  return i !== j && terminaEnMedianoche(a) && empiezaEnMedianoche(b) && b.fecha === fechaSiguiente(a.fecha);
}

/**
 * Etiquetas "Continúa del día anterior" / "Continúa el día siguiente" de un
 * turno. A diferencia de indiceContinuacion (que decide los avisos al borrar y
 * no enlaza dos "Día entero"), aqui los dias intermedios de una cadena (p. ej.
 * 19 y 20 en 18 → 19 → 20 → 21) tienen ambas. Solo hay etiquetas si la cadena
 * incluye algun turno que no sea "Día entero": dos dias enteros marcados a mano
 * no son un cuidado partido.
 */
export function etiquetasContinuidad(franjas: FranjaHoraria[], i: number): { viene: boolean; continua: boolean } {
  const visitados = new Set<number>([i]);
  const pendientes = [i];
  while (pendientes.length > 0) {
    const actual = pendientes.pop() as number;
    franjas.forEach((_, k) => {
      if (visitados.has(k)) return;
      if (hayContinuidad(franjas, actual, k) || hayContinuidad(franjas, k, actual)) {
        visitados.add(k);
        pendientes.push(k);
      }
    });
  }
  if ([...visitados].every((k) => franjas[k].diaEntero)) return { viene: false, continua: false };

  const continua = franjas.some((_, k) => hayContinuidad(franjas, i, k));
  const viene = franjas.some((_, k) => hayContinuidad(franjas, k, i));
  return { viene, continua };
}

/** Aviso que se muestra antes de borrar una mitad de un turno que cruza la medianoche. */
export function mensajeTurnoIncompleto(enlace: EnlaceTurno): string {
  const dia = etiquetaDia(enlace.fechaOtro);
  return enlace.tipo === "continua"
    ? `Este turno continúa el ${dia}. Si lo borras, el turno de ese día quedará incompleto.`
    : `Este turno es la continuación del turno del ${dia}. Si lo borras, el turno de ese día quedará incompleto.`;
}

/**
 * Anuncios guardados antes de este reparto pueden traer un turno que cruza la
 * medianoche en una sola franja (hasta <= desde): se parte en dos al cargarlo.
 */
export function normalizarFranjas(franjas: FranjaHoraria[]): FranjaHoraria[] {
  const resultado: FranjaHoraria[] = [];
  for (const f of franjas) {
    if (f.diaEntero) {
      resultado.push(f);
      continue;
    }
    if (f.horaDesde === FIN_DE_DIA && f.horaHasta === FIN_DE_DIA) {
      resultado.push({ ...f, diaEntero: true });
      continue;
    }
    const cruza = f.horaHasta !== FIN_DE_DIA && aMinutos(f.horaHasta) <= aMinutos(f.horaDesde);
    if (!cruza) {
      resultado.push(f);
      continue;
    }
    resultado.push({ ...f, horaHasta: FIN_DE_DIA });
    resultado.push({ fecha: fechaSiguiente(f.fecha), horaDesde: FIN_DE_DIA, horaHasta: f.horaHasta, diaEntero: false });
  }
  return resultado;
}
