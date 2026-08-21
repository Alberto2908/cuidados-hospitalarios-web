"use client";

import { useState } from "react";
import { Search, UserCheck, Star, UserX } from "lucide-react";
import { MOCK_CUIDADORES, Cuidador } from "@/lib/mock/usuarios";

const ESTADO_STYLES: Record<Cuidador["estado"], string> = {
  activo:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactivo:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  suspendido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ESTADO_LABEL: Record<Cuidador["estado"], string> = {
  activo:     "Activo",
  inactivo:   "Inactivo",
  suspendido: "Suspendido",
};

export default function AdminCuidadoresPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<Cuidador["estado"] | "todos">("todos");

  const cuidadoresFiltrados = MOCK_CUIDADORES.filter((c) => {
    const coincideBusqueda =
      `${c.nombre} ${c.apellido} ${c.email} ${c.especialidad}`.toLowerCase().includes(search.toLowerCase());
    const coincideEstado = filtroEstado === "todos" || c.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const totales = {
    total:      MOCK_CUIDADORES.length,
    activos:    MOCK_CUIDADORES.filter((c) => c.estado === "activo").length,
    suspendidos: MOCK_CUIDADORES.filter((c) => c.estado === "suspendido").length,
    valoracionMedia: (
      MOCK_CUIDADORES.reduce((acc, c) => acc + c.valoracion, 0) / MOCK_CUIDADORES.length
    ).toFixed(1),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Gestionar cuidadores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listado de todos los cuidadores registrados en la plataforma
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<UserCheck className="h-5 w-5" />} label="Total cuidadores" value={totales.total} display={String(totales.total)} color="text-foreground" />
        <StatCard icon={<UserCheck className="h-5 w-5" />} label="Activos" value={totales.activos} display={String(totales.activos)} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={<UserX className="h-5 w-5" />} label="Suspendidos" value={totales.suspendidos} display={String(totales.suspendidos)} color="text-red-600 dark:text-red-400" />
        <StatCard icon={<Star className="h-5 w-5" />} label="Valoración media" value={0} display={`★ ${totales.valoracionMedia}`} color="text-amber-500 dark:text-amber-400" />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "activo", "inactivo", "suspendido"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filtroEstado === e
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cuidador</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Especialidad</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Experiencia</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Valoración</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cuidadoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No se encontraron cuidadores
                  </td>
                </tr>
              ) : (
                cuidadoresFiltrados.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {c.nombre[0]}{c.apellido[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.nombre} {c.apellido}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">{c.telefono}</td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{c.especialidad}</td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      <span className="font-medium text-foreground">{c.experienciaAnios} años</span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      <span className="font-medium text-amber-500 dark:text-amber-400">★ {c.valoracion}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[c.estado]}`}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Mostrando {cuidadoresFiltrados.length} de {MOCK_CUIDADORES.length} cuidadores
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, display, color }: { icon: React.ReactNode; label: string; value: number; display: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-foreground">{display}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
