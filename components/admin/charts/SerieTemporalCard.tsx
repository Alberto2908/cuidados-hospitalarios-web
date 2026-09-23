"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LineChart, { type LineChartSerie } from "./LineChart";
import type { GranularidadDashboard } from "@/lib/api/admin";

const OPCIONES_GRANULARIDAD: { valor: GranularidadDashboard; label: string }[] = [
  { valor: "dias", label: "Días" },
  { valor: "meses", label: "Meses" },
  { valor: "anios", label: "Años" },
];

interface PuntoSerie {
  etiqueta: string;
  [serieKey: string]: string | number;
}

interface SerieTemporalCardProps {
  titulo: string;
  series: LineChartSerie[];
  /** Prefijo unico de la queryKey de react-query para esta tarjeta. */
  queryKeyBase: string;
  fetchSerie: (granularidad: GranularidadDashboard) => Promise<PuntoSerie[]>;
  formatearEtiqueta: (etiqueta: string, granularidad: GranularidadDashboard) => string;
}

/** Tarjeta de LineChart con su propio selector de dias/meses/años, independiente de cualquier otra grafica del dashboard. */
export default function SerieTemporalCard({ titulo, series, queryKeyBase, fetchSerie, formatearEtiqueta }: SerieTemporalCardProps) {
  const [granularidad, setGranularidad] = useState<GranularidadDashboard>("dias");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard", queryKeyBase, granularidad],
    queryFn: () => fetchSerie(granularidad),
  });

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
          {OPCIONES_GRANULARIDAD.map((op) => (
            <button
              key={op.valor}
              type="button"
              onClick={() => setGranularidad(op.valor)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                granularidad === op.valor
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading || !data ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Todavía no hay datos.</p>
      ) : (
        <LineChart data={data} series={series} formatearEtiqueta={(etiqueta) => formatearEtiqueta(etiqueta, granularidad)} />
      )}
    </div>
  );
}
