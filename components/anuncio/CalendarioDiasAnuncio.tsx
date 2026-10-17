"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { getDefaultClassNames } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { mensajeTurnoIncompleto, turnoPorDefecto, turnosQueQuedanIncompletos } from "@/lib/anuncio/turnos";
import type { FranjaHoraria } from "@/lib/anuncio/schema";
import {
  DEFAULT_HORA_DESDE,
  DEFAULT_HORA_HASTA,
} from "@/lib/anuncio/schema";

function toFechaKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function parseFechaKey(key: string) {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function fechasUnicas(franjas: FranjaHoraria[]) {
  return [...new Set(franjas.map((f) => f.fecha))].sort();
}

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Agrupa las fechas (yyyy-MM-dd, ordenadas) en tramos de días consecutivos.
 * Un día suelto es un círculo; varios seguidos se dibujan conectados, como un
 * rango (inicio, medio, fin).
 */
function tramosConsecutivos(claves: string[]) {
  const inicio: Date[] = [];
  const medio: Date[] = [];
  const fin: Date[] = [];
  let tramo: Date[] = [];

  function cerrarTramo() {
    if (tramo.length >= 2) {
      inicio.push(tramo[0]);
      medio.push(...tramo.slice(1, -1));
      fin.push(tramo[tramo.length - 1]);
    }
    tramo = [];
  }

  for (const clave of claves) {
    const fecha = parseFechaKey(clave);
    const anterior = tramo[tramo.length - 1];
    // Math.round: el cambio de hora hace que algunos días no midan 24 h exactas.
    if (anterior && Math.round((fecha.getTime() - anterior.getTime()) / MS_DIA) !== 1) cerrarTramo();
    tramo.push(fecha);
  }
  cerrarTramo();
  return { inicio, medio, fin };
}

interface Props {
  franjas: FranjaHoraria[];
  onChange: (franjas: FranjaHoraria[]) => void;
}

export default function CalendarioDiasAnuncio({ franjas, onChange }: Props) {
  const dias = fechasUnicas(franjas);
  const selected = dias.map(parseFechaKey);
  const tramos = tramosConsecutivos(dias);
  const today = startOfDay(new Date());
  // Desmarcar un día puede dejar a medias un turno que cruza la medianoche.
  const [pendiente, setPendiente] = useState<{ mensaje: string; fechas: Date[] } | null>(null);

  function handleSelect(dates: Date[] | undefined) {
    const nextKeys = new Set((dates ?? []).map(toFechaKey));
    const quitados = new Set(dias.filter((d) => !nextKeys.has(d)));
    const avisos = turnosQueQuedanIncompletos(franjas, quitados);
    if (avisos.length > 0) {
      setPendiente({ mensaje: mensajeTurnoIncompleto(avisos[0]), fechas: dates ?? [] });
      return;
    }
    aplicarSeleccion(dates);
  }

  function aplicarSeleccion(dates: Date[] | undefined) {
    const nextKeys = new Set((dates ?? []).map(toFechaKey));
    const kept = franjas.filter((f) => nextKeys.has(f.fecha));
    const keptFechas = new Set(kept.map((f) => f.fecha));

    const added: FranjaHoraria[] = [];
    const ahora = new Date();
    for (const key of nextKeys) {
      if (keptFechas.has(key)) continue;
      // Hoy no se puede empezar en una hora que ya paso: el turno propuesto
      // arranca en el siguiente cuarto de hora si las 09:00 ya quedaron atras.
      const turno = turnoPorDefecto(key, ahora, DEFAULT_HORA_DESDE, DEFAULT_HORA_HASTA);
      if (!turno) continue;
      added.push({ fecha: key, ...turno, diaEntero: false });
    }

    const next = [...kept, ...added].sort((a, b) => {
      const byFecha = a.fecha.localeCompare(b.fecha);
      if (byFecha !== 0) return byFecha;
      return a.horaDesde.localeCompare(b.horaDesde);
    });

    onChange(next);
  }

  return (
    <div className="flex h-full w-fit shrink-0 flex-col rounded-xl bg-surface-sunken p-2 shadow-inset-soft">
      <Calendar
        mode="multiple"
        locale={es}
        selected={selected}
        onSelect={handleSelect}
        // Hoy tambien se deshabilita cuando ya no queda ningun turno posible (pasadas las 23:45).
        disabled={[{ before: today }, ...(turnoPorDefecto(toFechaKey(today), new Date()) ? [] : [today])]}
        numberOfMonths={1}
        modifiers={{
          range_start: tramos.inicio,
          range_middle: tramos.medio,
          range_end: tramos.fin,
        }}
        classNames={{
          // Sin las reglas por defecto que redondean solo un lado en la primera y
          // la última columna: un día suelto es siempre un círculo completo.
          day: cn(
            "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
            getDefaultClassNames().day,
          ),
          today: "rounded-(--cell-radius) bg-accent text-accent-foreground data-[selected=true]:bg-transparent",
        }}
      />
      {dias.length > 0 ? (
        <p className="mt-auto border-t border-border px-2 pt-2 pb-1 text-center text-[11px] text-muted-foreground">
          {dias.length} {dias.length === 1 ? "día" : "días"} seleccionado
          {dias.length === 1 ? "" : "s"}
        </p>
      ) : null}
      <ConfirmDialog
        open={pendiente !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setPendiente(null);
        }}
        titulo="Turno incompleto"
        descripcion={`${pendiente?.mensaje ?? ""} ¿Quieres desmarcar el día igualmente?`}
        textoConfirmar="Desmarcar"
        onConfirmar={() => {
          aplicarSeleccion(pendiente?.fechas);
          setPendiente(null);
        }}
      />
    </div>
  );
}
