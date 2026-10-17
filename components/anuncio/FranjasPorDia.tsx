"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Moon, Plus, Trash2 } from "lucide-react";
import SelectorHora from "@/components/anuncio/SelectorHora";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import type { FranjaHoraria } from "@/lib/anuncio/schema";
import {
  DEFAULT_HORA_DESDE,
  DEFAULT_HORA_HASTA,
  DIA_ENTERO_DESDE,
  DIA_ENTERO_HASTA,
} from "@/lib/anuncio/schema";
import {
  accionContinuar,
  aplicarDesde,
  claveFecha,
  aplicarHasta,
  continuarDiaSiguiente,
  deMinutos,
  enlaceDe,
  etiquetaDia,
  etiquetasContinuidad,
  indicePadre,
  mensajeTurnoIncompleto,
  minutosFinEnElDia,
  opcionesDesde,
  opcionesHasta,
  turnosQueQuedanIncompletos,
} from "@/lib/anuncio/turnos";

/**
 * Sugiere el siguiente turno en pasos de 15 min tras el último del día, sin
 * salirse del día (un turno nunca cruza la medianoche en una sola franja).
 * Devuelve null si ya no cabe ninguno.
 */
function sugerirSiguienteTurno(turnos: FranjaHoraria[]): {
  horaDesde: string;
  horaHasta: string;
} | null {
  const ultimoFin = Math.max(
    -1,
    ...turnos.filter((t) => !t.diaEntero).map((t) => minutosFinEnElDia(t.horaHasta)),
  );

  if (ultimoFin < 0) {
    return { horaDesde: "14:00", horaHasta: "16:00" };
  }

  const desde = ultimoFin + 15;
  if (desde >= 24 * 60) return null;
  return {
    horaDesde: deMinutos(desde),
    horaHasta: deMinutos(Math.min(desde + 120, 24 * 60)),
  };
}

function resumenDia(turnos: FranjaHoraria[]) {
  if (turnos.some((t) => t.diaEntero)) return "00:00 – 00:00 (día completo)";
  return turnos.map((t) => `${t.horaDesde} – ${t.horaHasta}`).join(" · ");
}

function groupByFecha(franjas: FranjaHoraria[]) {
  const map = new Map<string, { franja: FranjaHoraria; index: number }[]>();
  franjas.forEach((franja, index) => {
    const list = map.get(franja.fecha) ?? [];
    list.push({ franja, index });
    map.set(franja.fecha, list);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

interface Props {
  franjas: FranjaHoraria[];
  onChange: (franjas: FranjaHoraria[]) => void;
}

export default function FranjasPorDia({ franjas, onChange }: Props) {
  const dias = useMemo(() => groupByFecha(franjas), [franjas]);
  const ahora = new Date();
  const hoy = claveFecha(ahora);
  // Borrar una mitad de un turno que cruza la medianoche deja la otra a medias:
  // se pide confirmación antes.
  const [pendiente, setPendiente] = useState<{
    titulo: string;
    descripcion: string;
    textoConfirmar: string;
    accion: () => void;
  } | null>(null);

  if (franjas.length === 0) {
    return (
      <div className="flex h-full min-h-70 flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-surface-sunken px-6 py-8 text-center shadow-inset-soft">
        <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
          <CalendarPlus className="size-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Aún no hay días marcados
          </p>
        </div>
      </div>
    );
  }

  function updateAt(index: number, patch: Partial<FranjaHoraria>) {
    onChange(
      franjas.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function pedirConfirmacion(mensaje: string, accion: () => void) {
    setPendiente({
      titulo: "Turno incompleto",
      descripcion: `${mensaje} ¿Quieres borrarlo igualmente?`,
      textoConfirmar: "Borrar",
      accion,
    });
  }


  function removeAt(index: number) {
    const enlace = enlaceDe(franjas, index);
    const borrar = () => onChange(franjas.filter((_, i) => i !== index));
    if (enlace) pedirConfirmacion(mensajeTurnoIncompleto(enlace), borrar);
    else borrar();
  }

  function removeDia(fecha: string) {
    const borrar = () => onChange(franjas.filter((f) => f.fecha !== fecha));
    const avisos = turnosQueQuedanIncompletos(franjas, new Set([fecha]));
    if (avisos.length > 0) pedirConfirmacion(mensajeTurnoIncompleto(avisos[0]), borrar);
    else borrar();
  }

  function addTurno(fecha: string, turnos: FranjaHoraria[]) {
    const sugerido = sugerirSiguienteTurno(turnos);
    if (!sugerido) return;
    onChange([
      ...franjas,
      {
        fecha,
        horaDesde: sugerido.horaDesde,
        horaHasta: sugerido.horaHasta,
        diaEntero: false,
      },
    ]);
  }

  function toggleDiaEntero(
    fecha: string,
    turnosConIndex: { franja: FranjaHoraria; index: number }[],
    checked: boolean,
  ) {
    if (checked) {
      const resto = franjas.filter((f) => f.fecha !== fecha);
      const aplicar = () =>
        onChange([
          ...resto,
          {
            fecha,
            horaDesde: DIA_ENTERO_DESDE,
            horaHasta: DIA_ENTERO_HASTA,
            diaEntero: true,
          },
        ]);
      // Sustituir los turnos del día por "Día entero" también rompe los que
      // enlazan con el día anterior o el siguiente.
      const avisos = turnosQueQuedanIncompletos(franjas, new Set([fecha]));
      if (avisos.length > 0) pedirConfirmacion(mensajeTurnoIncompleto(avisos[0]), aplicar);
      else aplicar();
      return;
    }
    const firstIndex = turnosConIndex[0]?.index;
    if (firstIndex === undefined) return;
    updateAt(firstIndex, {
      diaEntero: false,
      horaDesde: DEFAULT_HORA_DESDE,
      horaHasta: DEFAULT_HORA_HASTA,
    });
  }

  return (
    <>
      <ul className="flex h-full min-h-0 flex-1 flex-col gap-2.5">
        {dias.map(([fecha, turnosConIndex]) => {
          const turnos = turnosConIndex.map((t) => t.franja);
          const label = etiquetaDia(fecha);
          const diaEntero = turnos.some((t) => t.diaEntero);
          const continuidad = turnosConIndex.map(({ index }) => etiquetasContinuidad(franjas, index));
          const continuaDespues = continuidad.some((c) => c.continua);
          const vieneDeAntes = continuidad.some((c) => c.viene);
          const sePuedeAnadirTurno = sugerirSiguienteTurno(turnos) !== null;

          return (
            <li
              key={fecha}
              className="flex flex-col gap-3 rounded-xl bg-surface-sunken p-3.5 shadow-inset-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize text-foreground">
                    {label}
                  </p>
                  {/* Resumen del día y, a su derecha, las etiquetas de continuidad (pasan a otra línea si no caben) */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <p className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium tabular-nums text-accent-foreground">
                      {resumenDia(turnos)}
                    </p>
                    {vieneDeAntes ? (
                      <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Moon className="size-3" />
                        Continúa del día anterior
                      </p>
                    ) : null}
                    {continuaDespues ? (
                      <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Moon className="size-3" />
                        Continúa el día siguiente
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${label}`}
                  onClick={() => removeDia(fecha)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5">
                <label
                  htmlFor={`dia-entero-${fecha}`}
                  className="flex shrink-0 cursor-pointer items-center gap-2 pb-1.5 text-sm text-foreground"
                >
                  <Checkbox
                    id={`dia-entero-${fecha}`}
                    checked={diaEntero}
                    // "Día entero" empieza a las 00:00: hoy ya habria empezado.
                    disabled={fecha === hoy}
                    onCheckedChange={(checked) =>
                      toggleDiaEntero(fecha, turnosConIndex, checked === true)
                    }
                    className="border-foreground/25 bg-card"
                  />
                  Día entero
                </label>

                {turnosConIndex.map(({ franja: t, index }, turnoIdx) => {
                  const esContinuacion = indicePadre(franjas, index) >= 0;
                  const continuar = accionContinuar(franjas, index);
                  return (
                    <div
                      key={`${fecha}-${index}`}
                      className="flex shrink-0 items-end gap-2"
                    >
                      {turnosConIndex.length > 1 ? (
                        <span className="mb-2 w-14 shrink-0 text-[11px] font-medium text-muted-foreground">
                          Turno {turnoIdx + 1}
                        </span>
                      ) : null}
                      <div className="grid gap-1">
                        <Label htmlFor={`desde-${fecha}-${index}`} className="text-xs">
                          Desde
                        </Label>
                        <SelectorHora
                          id={`desde-${fecha}-${index}`}
                          value={t.horaDesde}
                          opciones={opcionesDesde(fecha, ahora)}
                          disabled={diaEntero || esContinuacion}
                          onChange={(hora) => onChange(aplicarDesde(franjas, index, hora))}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`hasta-${fecha}-${index}`} className="text-xs">
                          Hasta
                        </Label>
                        <SelectorHora
                          id={`hasta-${fecha}-${index}`}
                          value={t.horaHasta}
                          opciones={opcionesHasta(franjas, index)}
                          accionExtra={
                            continuar
                              ? { ...continuar, onSelect: () => onChange(continuarDiaSiguiente(franjas, index)) }
                              : undefined
                          }
                          disabled={diaEntero}
                          onChange={(hora) => onChange(aplicarHasta(franjas, index, hora))}
                        />
                      </div>
                      {turnosConIndex.length > 1 && !diaEntero ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Quitar turno ${turnoIdx + 1}`}
                          onClick={() => removeAt(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  );
                })}

                {!diaEntero ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!sePuedeAnadirTurno}
                    onClick={() => addTurno(fecha, turnos)}
                    className="w-fit shrink-0 gap-1.5"
                  >
                    <Plus className="size-4" />
                    Añadir turno
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={pendiente !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setPendiente(null);
        }}
        titulo={pendiente?.titulo ?? ""}
        descripcion={pendiente?.descripcion ?? ""}
        textoConfirmar={pendiente?.textoConfirmar}
        onConfirmar={() => {
          pendiente?.accion();
          setPendiente(null);
        }}
      />
    </>
  );
}
