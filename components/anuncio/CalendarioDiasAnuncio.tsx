"use client";

import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
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

interface Props {
  franjas: FranjaHoraria[];
  onChange: (franjas: FranjaHoraria[]) => void;
}

export default function CalendarioDiasAnuncio({ franjas, onChange }: Props) {
  const dias = fechasUnicas(franjas);
  const selected = dias.map(parseFechaKey);
  const today = startOfDay(new Date());

  function handleSelect(dates: Date[] | undefined) {
    const nextKeys = new Set((dates ?? []).map(toFechaKey));
    const kept = franjas.filter((f) => nextKeys.has(f.fecha));
    const keptFechas = new Set(kept.map((f) => f.fecha));

    const added: FranjaHoraria[] = [];
    for (const key of nextKeys) {
      if (keptFechas.has(key)) continue;
      added.push({
        fecha: key,
        horaDesde: DEFAULT_HORA_DESDE,
        horaHasta: DEFAULT_HORA_HASTA,
        diaEntero: false,
      });
    }

    const next = [...kept, ...added].sort((a, b) => {
      const byFecha = a.fecha.localeCompare(b.fecha);
      if (byFecha !== 0) return byFecha;
      return a.horaDesde.localeCompare(b.horaDesde);
    });

    onChange(next);
  }

  return (
    <div className="flex h-full w-fit shrink-0 flex-col rounded-xl border border-border bg-card p-2 shadow-sm">
      <Calendar
        mode="multiple"
        locale={es}
        selected={selected}
        onSelect={handleSelect}
        disabled={{ before: today }}
        numberOfMonths={1}
      />
      {dias.length > 0 ? (
        <p className="mt-auto border-t border-border px-2 pt-2 pb-1 text-center text-[11px] text-muted-foreground">
          {dias.length} {dias.length === 1 ? "día" : "días"} seleccionado
          {dias.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
