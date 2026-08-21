"use client";

import { useState } from "react";
import { Search, Users, FileText, UserX } from "lucide-react";
import { MOCK_PACIENTES, Paciente } from "@/lib/mock/usuarios";

const ESTADO_STYLES: Record<Paciente["estado"], string> = {
  activo:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactivo:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  suspendido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ESTADO_LABEL: Record<Paciente["estado"], string> = {
  activo:     "Activo",
  inactivo:   "Inactivo",
  suspendido: "Suspendido",
};

export default function AdminPacientesPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<Paciente["estado"] | "todos">("todos");

  const pacientesFiltrados = MOCK_PACIENTES.filter((p) => {
    const coincideBusqueda =
      `${p.nombre} ${p.apellido} ${p.email}`.toLowerCase().includes(search.toLowerCase());
    const coincideEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const totales = {
    total:      MOCK_PACIENTES.length,
    activos:    MOCK_PACIENTES.filter((p) => p.estado === "activo").length,
    suspendidos: MOCK_PACIENTES.filter((p) => p.estado === "suspendido").length,
    anuncios:   MOCK_PACIENTES.reduce((acc, p) => acc + p.anunciosActivos, 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Gestionar pacientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listado de todos los pacientes registrados en la plataforma
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total pacientes" value={totales.total} color="text-foreground" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Activos" value={totales.activos} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={<UserX className="h-5 w-5" />} label="Suspendidos" value={totales.suspendidos} color="text-red-600 dark:text-red-400" />
        <StatCard icon={<FileText className="h-5 w-5" />} label="Anuncios activos" value={totales.anuncios} color="text-sky-600 dark:text-sky-400" />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
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
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Registro</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Anuncios</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pacientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No se encontraron pacientes
                  </td>
                </tr>
              ) : (
                pacientesFiltrados.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                          {p.nombre[0]}{p.apellido[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{p.nombre} {p.apellido}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">{p.telefono}</td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                      {new Date(p.fechaRegistro).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      <span className="font-medium text-foreground">{p.anunciosActivos}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[p.estado]}`}>
                        {ESTADO_LABEL[p.estado]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Mostrando {pacientesFiltrados.length} de {MOCK_PACIENTES.length} pacientes
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
