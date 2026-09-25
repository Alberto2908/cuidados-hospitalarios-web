"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Search, XCircle } from "lucide-react";
import { fetchAdminAnuncios, fetchAdminAnunciosResumen } from "@/lib/api/admin";
import type { EstadoAnuncio } from "@/lib/api/anuncios";
import { formatearFecha } from "@/lib/fecha";

const ESTADO_STYLES: Record<EstadoAnuncio, string> = {
  activo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  cubierto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ESTADO_LABEL: Record<EstadoAnuncio, string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  cancelado: "Cancelado",
};

const TAMANO_PAGINA = 20;

export default function AdminAnunciosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busqueda, setBusqueda] = useState(""); // version debounced de `search`, la que de verdad se envia
  const [filtroEstado, setFiltroEstado] = useState<EstadoAnuncio | "todos">("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(0);

  // Busqueda con debounce: cada tecla ya no filtra en el cliente, dispara una
  // peticion al backend -> sin esperar, se mandarian decenas de peticiones
  // por cada palabra escrita. Cualquier cambio de filtro vuelve a la primera
  // pagina (una pagina 5 con un filtro nuevo casi seguro no existe).
  useEffect(() => {
    const id = setTimeout(() => {
      setBusqueda(search.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const filtrosBase = { desde: desde || undefined, hasta: hasta || undefined, busqueda: busqueda || undefined };

  const { data: pagina, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["admin", "anuncios", { ...filtrosBase, estado: filtroEstado, page }],
    queryFn: () =>
      fetchAdminAnuncios({
        ...filtrosBase,
        estado: filtroEstado === "todos" ? undefined : filtroEstado,
        page,
        size: TAMANO_PAGINA,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: resumen } = useQuery({
    queryKey: ["admin", "anuncios", "resumen", filtrosBase],
    queryFn: () => fetchAdminAnunciosResumen(filtrosBase),
    placeholderData: keepPreviousData,
  });

  const anuncios = pagina?.content ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Gestionar anuncios</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Listado de todos los anuncios publicados en la plataforma
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Total anuncios" value={resumen?.total ?? 0} color="text-foreground" />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Activos" value={resumen?.activos ?? 0} color="text-sky-600 dark:text-sky-400" />
        <StatCard icon={<FileText className="h-5 w-5" />} label="Aceptados" value={resumen?.cubiertos ?? 0} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Cancelados" value={resumen?.cancelados ?? 0} color="text-red-600 dark:text-red-400" />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título, paciente u hospital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border-0 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none ring-ring focus:ring-2"
            />
          </div>
          <div className="inline-flex gap-1 rounded-full bg-card p-1 shadow-soft">
            {(["todos", "activo", "cubierto", "cancelado"] as const).map((e) => (
              <button
                key={e}
                onClick={() => {
                  setFiltroEstado(e);
                  setPage(0);
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                  filtroEstado === e
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 text-muted-foreground">
            Publicado entre
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => {
                setDesde(e.target.value);
                setPage(0);
              }}
              className="rounded-xl border-0 bg-card px-2 py-1 text-foreground shadow-soft outline-none ring-ring focus:ring-2"
            />
          </label>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            y
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => {
                setHasta(e.target.value);
                setPage(0);
              }}
              className="rounded-xl border-0 bg-card px-2 py-1 text-foreground shadow-soft outline-none ring-ring focus:ring-2"
            />
          </label>
          {(desde || hasta) && (
            <button
              type="button"
              onClick={() => {
                setDesde("");
                setHasta("");
                setPage(0);
              }}
              className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Quitar fechas
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-float">
        <div className={`overflow-x-auto ${isPlaceholderData ? "opacity-60" : ""}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Anuncio</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Hospital</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Postulaciones</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Inicio previsto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            {/* overflow-anchor: none - cada fila usa el id del anuncio como key, distinto
                en cada pagina: al cambiar de pagina se sustituyen todas las filas de golpe
                y el navegador, al perder la fila que estaba anclando el scroll, lo salta
                al principio de la pagina. Esto evita ese salto. */}
            <tbody className="divide-y divide-border [overflow-anchor:none]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-destructive">
                    No se pudieron cargar los anuncios: {error instanceof Error ? error.message : "error desconocido"}
                  </td>
                </tr>
              ) : anuncios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No se encontraron anuncios
                  </td>
                </tr>
              ) : (
                anuncios.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => router.push(`/admin/anuncios/${a.id}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">{a.pacienteNombre}</p>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {a.hospital.nombre} · {a.hospital.ciudad}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      <span className="font-medium text-foreground">{a.totalPostulaciones}</span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                      {formatearFecha(a.fechaInicioPrevista)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[a.estado]}`}>
                        {ESTADO_LABEL[a.estado]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            {pagina && pagina.totalElements > 0
              ? `${page * TAMANO_PAGINA + 1}–${Math.min((page + 1) * TAMANO_PAGINA, pagina.totalElements)} de ${pagina.totalElements} anuncios`
              : "0 anuncios"}
          </span>
          {pagina && pagina.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <span className="px-2">
                Página {page + 1} de {pagina.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= pagina.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-float">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
