"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, CircleCheck, HandCoins, Landmark, Percent, Undo2, Wallet } from "lucide-react";
import StatTile from "@/components/admin/charts/StatTile";
import { fetchPagos, fetchPagosResumen, type FiltroPagos, type PagoFila } from "@/lib/api/adminPagos";
import { formatearFecha } from "@/lib/fecha";
import { formatearEuros } from "@/lib/pago/formato";
import {
  ESTADO_PAGO_ADMIN_COLOR,
  ESTADO_PAGO_ADMIN_LABEL,
  ESTADO_SERVICIO_ADMIN_LABEL,
  MOTIVO_TITULO,
} from "@/lib/pago/estados";
import { cn } from "@/lib/utils";

const VACIO: Record<FiltroPagos, string> = {
  atencion: "No hay ningún pago que necesite tu decisión. Todo está en orden.",
  retenidos: "Ahora mismo no hay dinero retenido en la plataforma.",
  todos: "Todavía no hay pagos.",
};

export default function AdminPagosPage() {
  const [filtro, setFiltro] = useState<FiltroPagos>("atencion");

  const resumenQuery = useQuery({
    queryKey: ["admin", "pagos", "resumen"],
    queryFn: fetchPagosResumen,
    refetchInterval: 30 * 1000,
  });
  const listaQuery = useQuery({
    queryKey: ["admin", "pagos", "lista", filtro],
    queryFn: () => fetchPagos(filtro),
    refetchInterval: 30 * 1000,
  });

  const resumen = resumenQuery.data;
  const pagos = listaQuery.data ?? [];

  const pestanas: { valor: FiltroPagos; etiqueta: string; conteo?: number }[] = [
    { valor: "atencion", etiqueta: "Necesitan tu decisión", conteo: resumen?.requierenAtencion },
    { valor: "retenidos", etiqueta: "Dinero retenido", conteo: resumen?.retenidos },
    { valor: "todos", etiqueta: "Historial" },
  ];

  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Pagos</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          El dinero de las familias queda retenido en la plataforma hasta que se confirma el cuidado. Aquí ves lo que hay
          en juego y resuelves las incidencias.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Wallet className="h-5 w-5" />}
          label="Retenido en la plataforma"
          subtext="(aún no es del cuidador)"
          value={resumen ? formatearEuros(resumen.retenido) : "…"}
          color="text-amber-600"
        />
        <StatTile
          icon={<HandCoins className="h-5 w-5" />}
          label="Entregado a cuidadores"
          value={resumen ? formatearEuros(resumen.entregadoCuidadores) : "…"}
          color="text-emerald-600"
        />
        <StatTile
          icon={<Undo2 className="h-5 w-5" />}
          label="Devuelto a familias"
          value={resumen ? formatearEuros(resumen.devueltoFamilias) : "…"}
          color="text-sky-600"
        />
        <StatTile
          icon={<Percent className="h-5 w-5" />}
          label="Comisión de la plataforma"
          value={resumen ? formatearEuros(resumen.comisiones) : "…"}
          color="text-primary"
        />
      </div>

      {resumen && (
        <div
          className={cn(
            "mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium",
            resumen.requierenAtencion > 0
              ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          )}
        >
          {resumen.requierenAtencion > 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {resumen.requierenAtencion === 1
                ? "Hay 1 pago que necesita tu decisión."
                : `Hay ${resumen.requierenAtencion} pagos que necesitan tu decisión.`}
            </>
          ) : (
            <>
              <CircleCheck className="h-5 w-5 shrink-0" />
              No hay ningún pago pendiente de tu decisión.
            </>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist">
        {pestanas.map((p) => (
          <button
            key={p.valor}
            type="button"
            role="tab"
            aria-selected={filtro === p.valor}
            onClick={() => setFiltro(p.valor)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filtro === p.valor ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-soft hover:bg-muted",
            )}
          >
            {p.etiqueta}
            {p.conteo !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  filtro === p.valor ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                )}
              >
                {p.conteo}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {listaQuery.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : pagos.length === 0 ? (
          <div className="rounded-2xl bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-float">
            <Landmark className="mx-auto mb-2 h-6 w-6" />
            {VACIO[filtro]}
          </div>
        ) : (
          pagos.map((pago) => <TarjetaPago key={pago.servicioId} pago={pago} />)
        )}
        {filtro === "todos" && pagos.length >= 200 && (
          <p className="text-center text-xs text-muted-foreground">Se muestran los 200 pagos más recientes.</p>
        )}
      </div>
    </div>
  );
}

function TarjetaPago({ pago }: { pago: PagoFila }) {
  return (
    <Link
      href={`/admin/pagos/${pago.servicioId}`}
      className="group block rounded-2xl bg-card p-5 shadow-float transition-shadow duration-200 hover:shadow-[0_5px_16px_oklch(0.29_0.05_265/0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{pago.anuncioTitulo}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {pago.pacienteNombre} (familia) → {pago.cuidadorNombre} (cuidador)
          </p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_PAGO_ADMIN_COLOR[pago.estadoPago]}`}>
          {ESTADO_PAGO_ADMIN_LABEL[pago.estadoPago]}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {ESTADO_SERVICIO_ADMIN_LABEL[pago.estado]}
        </span>
        <span className="text-xs text-muted-foreground">Termina el {formatearFecha(pago.fechaFinPrevista)}</span>
      </div>

      <p className="mt-3 text-sm text-foreground">
        {pago.importeRetenido > 0 ? (
          <>
            <strong>{formatearEuros(pago.importeRetenido)}</strong> retenidos
            {pago.importeRetenido !== pago.importeTotal && <> de {formatearEuros(pago.importeTotal)} en total</>}
          </>
        ) : (
          <>
            Importe del servicio: <strong>{formatearEuros(pago.importeTotal)}</strong>
          </>
        )}
      </p>

      {pago.motivos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {pago.motivos.map((m) => (
            <li
              key={m.codigo}
              className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <p className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {MOTIVO_TITULO[m.codigo] ?? m.codigo}
              </p>
              <p className="mt-0.5 text-xs">{m.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
