"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, FileText, UserX } from "lucide-react";
import { fetchAdminPacientes, type EstadoUsuario } from "@/lib/api/admin";
import { formatearFecha } from "@/lib/fecha";
import EstadoUsuarioBadge, { ESTADO_USUARIO_LABEL } from "@/components/admin/EstadoUsuarioBadge";

export default function AdminPacientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoUsuario | "todos">("todos");

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ["admin", "pacientes"],
    queryFn: fetchAdminPacientes,
  });

  const pacientesFiltrados = pacientes.filter((p) => {
    const coincideBusqueda =
      `${p.nombre} ${p.apellidos} ${p.email}`.toLowerCase().includes(search.toLowerCase());
    const coincideEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const totales = {
    total: pacientes.length,
    activos: pacientes.filter((p) => p.estado === "activo").length,
    suspendidos: pacientes.filter((p) => p.estado === "suspendido").length,
    anuncios: pacientes.reduce((acc, p) => acc + p.anunciosActivos, 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Gestionar pacientes</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
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
            className="h-10 w-full rounded-xl border-0 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none ring-ring focus:ring-2"
          />
        </div>
        <div className="inline-flex gap-1 rounded-full bg-card p-1 shadow-soft">
          {(["todos", "activo", "pendiente", "suspendido", "baja"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`rounded-full px-3.5 py-2 text-xs font-medium capitalize transition-colors ${
                filtroEstado === e
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {e === "todos" ? "Todos" : ESTADO_USUARIO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-float">
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              ) : pacientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No se encontraron pacientes
                  </td>
                </tr>
              ) : (
                pacientesFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/admin/pacientes/${p.id}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {p.nombre[0]}{p.apellidos[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{p.nombre} {p.apellidos}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">{p.telefono ?? "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                      {formatearFecha(p.creadoEn)}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      <span className="font-medium text-foreground">{p.anunciosActivos}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <EstadoUsuarioBadge estado={p.estado} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Mostrando {pacientesFiltrados.length} de {pacientes.length} pacientes
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
