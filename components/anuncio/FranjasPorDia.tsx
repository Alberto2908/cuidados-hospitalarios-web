"use client";

import { useMemo } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, Moon, Plus, Trash2 } from "lucide-react";
import SelectorHora from "@/components/anuncio/SelectorHora";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FranjaHoraria } from "@/lib/anuncio/schema";
import {
  DEFAULT_HORA_DESDE,
  DEFAULT_HORA_HASTA,
  DIA_ENTERO_DESDE,
  DIA_ENTERO_HASTA,
} from "@/lib/anuncio/schema";

function cruzaMedianoche(desde: string, hasta: string) {
  return hasta <= desde;
}

function toMinutes(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Sugiere el siguiente turno en pasos de 15 min tras el último del día. */
function sugerirSiguienteTurno(turnos: FranjaHoraria[]): {
  horaDesde: string;
  horaHasta: string;
} {
  const ultimo = [...turnos].sort((a, b) =>
    a.horaHasta.localeCompare(b.horaHasta),
  )[turnos.length - 1];

  if (!ultimo || ultimo.diaEntero) {
    return { horaDesde: "14:00", horaHasta: "16:00" };
  }

  const desde = fromMinutes(toMinutes(ultimo.horaHasta) + 15);
  const hasta = fromMinutes(toMinutes(desde) + 120);
  return { horaDesde: desde, horaHasta: hasta };
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

  if (franjas.length === 0) {
    return (
      <div className="flex h-full min-h-70 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
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

  function removeAt(index: number) {
    onChange(franjas.filter((_, i) => i !== index));
  }

  function removeDia(fecha: string) {
    onChange(franjas.filter((f) => f.fecha !== fecha));
  }

  function addTurno(fecha: string, turnos: FranjaHoraria[]) {
    const sugerido = sugerirSiguienteTurno(turnos);
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
      onChange([
        ...resto,
        {
          fecha,
          horaDesde: DIA_ENTERO_DESDE,
          horaHasta: DIA_ENTERO_HASTA,
          diaEntero: true,
        },
      ]);
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
    <ul className="flex h-full min-h-0 flex-1 flex-col gap-2.5">
      {dias.map(([fecha, turnosConIndex]) => {
        const turnos = turnosConIndex.map((t) => t.franja);
        const label = format(
          parse(fecha, "yyyy-MM-dd", new Date()),
          "EEEE d MMM",
          { locale: es },
        );
        const diaEntero = turnos.some((t) => t.diaEntero);
        const overnight = turnos.some(
          (t) => !t.diaEntero && cruzaMedianoche(t.horaDesde, t.horaHasta),
        );

        return (
          <li
            key={fecha}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize text-foreground">
                  {label}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  {resumenDia(turnos)}
                </p>
                {overnight ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Moon className="size-3" />
                    Cruza medianoche
                  </p>
                ) : null}
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

            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={`dia-entero-${fecha}`}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <Checkbox
                  id={`dia-entero-${fecha}`}
                  checked={diaEntero}
                  onCheckedChange={(checked) =>
                    toggleDiaEntero(fecha, turnosConIndex, checked === true)
                  }
                />
                Día entero
              </label>
            </div>

            <div className="flex flex-col gap-2">
              {turnosConIndex.map(({ franja: t, index }, turnoIdx) => (
                <div
                  key={`${fecha}-${index}`}
                  className="flex flex-wrap items-end gap-2 sm:gap-3"
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
                      disabled={diaEntero}
                      onChange={(hora) =>
                        updateAt(index, {
                          horaDesde: hora,
                          diaEntero: false,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`hasta-${fecha}-${index}`} className="text-xs">
                      Hasta
                    </Label>
                    <SelectorHora
                      id={`hasta-${fecha}-${index}`}
                      value={t.horaHasta}
                      disabled={diaEntero}
                      onChange={(hora) =>
                        updateAt(index, {
                          horaHasta: hora,
                          diaEntero: false,
                        })
                      }
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
              ))}
            </div>

            {!diaEntero ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTurno(fecha, turnos)}
                className="w-fit gap-1.5"
              >
                <Plus className="size-4" />
                Añadir turno
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
