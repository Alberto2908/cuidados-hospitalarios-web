"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Building2,
  Euro,
  FileText,
  MessageSquare,
  Radio,
  Star,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  fetchAdminDashboard,
  fetchAdminDashboardAnunciosPublicados,
  fetchAdminDashboardRegistros,
  type GranularidadDashboard,
} from "@/lib/api/admin";
import StatTile, { formatearNumeroCompacto } from "@/components/admin/charts/StatTile";
import SerieTemporalCard from "@/components/admin/charts/SerieTemporalCard";
import BarChart, { type BarChartDato } from "@/components/admin/charts/BarChart";
import { CHART_COLORS } from "@/components/admin/charts/colors";

const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-09-20" -> "20/09" · "2026-09" -> "sep 26" · "2026" -> "2026" */
function formatearEtiquetaPorGranularidad(etiqueta: string, granularidad: GranularidadDashboard): string {
  if (granularidad === "anios") return etiqueta;
  if (granularidad === "meses") {
    const [anio, mes] = etiqueta.split("-");
    return `${MES_CORTO[Number(mes) - 1]} ${anio.slice(2)}`;
  }
  const [, mes, dia] = etiqueta.split("-");
  return `${dia}/${mes}`;
}

const LABEL_ESTADO_USUARIO: Record<string, string> = {
  activo: "Activo",
  pendiente: "Pendiente",
  suspendido: "Suspendido",
  baja: "De baja",
};

const LABEL_ESTADO_ANUNCIO: Record<string, string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  cancelado: "Cancelado",
};

const COLOR_ESTADO_ANUNCIO: Record<string, string> = {
  activo: CHART_COLORS.sky,
  cubierto: CHART_COLORS.emerald,
  cancelado: CHART_COLORS.red,
};

const LABEL_ESTADO_POSTULACION: Record<string, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  retirada: "Retirada",
};

const COLOR_ESTADO_POSTULACION: Record<string, string> = {
  pendiente: CHART_COLORS.amber,
  aceptada: CHART_COLORS.emerald,
  rechazada: CHART_COLORS.red,
  retirada: CHART_COLORS.orange,
};

const LABEL_ESTADO_SERVICIO: Record<string, string> = {
  en_curso: "En curso",
  pendiente_confirmacion: "Pend. confirmación",
  confirmado: "Confirmado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const COLOR_ESTADO_SERVICIO: Record<string, string> = {
  en_curso: CHART_COLORS.sky,
  pendiente_confirmacion: CHART_COLORS.amber,
  confirmado: CHART_COLORS.violet,
  pagado: CHART_COLORS.emerald,
  cancelado: CHART_COLORS.red,
};

const formatoEuros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function aBarras(
  porEstado: Partial<Record<string, number>>,
  labels: Record<string, string>,
  colores: Record<string, string>,
): BarChartDato[] {
  return Object.entries(porEstado)
    .filter((entrada): entrada is [string, number] => (entrada[1] ?? 0) > 0)
    .map(([estado, total]) => ({
      label: labels[estado] ?? estado,
      value: total,
      color: colores[estado] ?? CHART_COLORS.zinc,
    }));
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: fetchAdminDashboard,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Métricas y actividad de toda la plataforma</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">
          No se pudo cargar el dashboard: {error instanceof Error ? error.message : "error desconocido"}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              icon={<Users className="h-5 w-5" />}
              label="Pacientes"
              value={formatearNumeroCompacto(data.usuarios.totalPacientes)}
              color="text-sky-600 dark:text-sky-400"
            />
            <StatTile
              icon={<UserCheck className="h-5 w-5" />}
              label="Cuidadores"
              value={formatearNumeroCompacto(data.usuarios.totalCuidadores)}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              icon={<Radio className="h-5 w-5" />}
              label="Sesiones activas"
              value={formatearNumeroCompacto(data.usuarios.sesionesActivas)}
              subtext="últimos 20 min"
              color="text-sky-600 dark:text-sky-400"
            />
            <StatTile
              icon={<Wallet className="h-5 w-5" />}
              label="Tarifa media"
              value={data.usuarios.tarifaMediaCuidadores != null ? `${data.usuarios.tarifaMediaCuidadores.toFixed(1)} €/h` : "—"}
              subtext="de los cuidadores"
            />
            <StatTile
              icon={<FileText className="h-5 w-5" />}
              label="Anuncios totales"
              value={formatearNumeroCompacto(data.anuncios.total)}
              subtext={`${formatearNumeroCompacto(data.anuncios.porEstado.activo ?? 0)} activos`}
            />
            <StatTile
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Sin postulaciones"
              value={formatearNumeroCompacto(data.anuncios.sinPostulaciones)}
              subtext="anuncios activos"
              color="text-amber-500 dark:text-amber-400"
            />
            <StatTile
              icon={<MessageSquare className="h-5 w-5" />}
              label="Postulaciones"
              value={formatearNumeroCompacto(data.postulaciones.total)}
              subtext={`${data.postulaciones.tasaAceptacion}% aceptadas`}
              color="text-violet-600 dark:text-violet-400"
            />
            <StatTile
              icon={<Euro className="h-5 w-5" />}
              label="Facturación generada"
              value={formatoEuros.format(data.servicios.importeGenerado)}
              subtext="pagos procesados"
              color="text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              icon={<Star className="h-5 w-5" />}
              label="Valoración media"
              value={data.servicios.valoracionMedia != null ? data.servicios.valoracionMedia.toFixed(1) : "—"}
              subtext={data.servicios.valoracionMedia != null ? "de 5" : "aún sin datos"}
              color="text-amber-500 dark:text-amber-400"
            />
            <StatTile
              icon={<Activity className="h-5 w-5" />}
              label="Servicios en curso"
              value={formatearNumeroCompacto(data.servicios.porEstado.en_curso ?? 0)}
              subtext="ahora mismo"
              color="text-sky-600 dark:text-sky-400"
            />
          </div>

          {/* Series temporales: cada una con su propio selector de dias/meses/años */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SerieTemporalCard
              titulo="Registros"
              queryKeyBase="registros"
              fetchSerie={fetchAdminDashboardRegistros}
              formatearEtiqueta={formatearEtiquetaPorGranularidad}
              series={[
                { key: "pacientes", label: "Pacientes", color: CHART_COLORS.sky },
                { key: "cuidadores", label: "Cuidadores", color: CHART_COLORS.emerald },
              ]}
            />
            <SerieTemporalCard
              titulo="Anuncios publicados"
              queryKeyBase="anuncios-publicados"
              fetchSerie={fetchAdminDashboardAnunciosPublicados}
              formatearEtiqueta={formatearEtiquetaPorGranularidad}
              series={[{ key: "total", label: "Anuncios", color: CHART_COLORS.violet }]}
            />
          </div>

          {/* Desgloses por estado */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">Anuncios por estado</p>
              <BarChart data={aBarras(data.anuncios.porEstado, LABEL_ESTADO_ANUNCIO, COLOR_ESTADO_ANUNCIO)} height={180} />
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">Postulaciones por estado</p>
              <BarChart
                data={aBarras(data.postulaciones.porEstado, LABEL_ESTADO_POSTULACION, COLOR_ESTADO_POSTULACION)}
                height={180}
              />
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">Servicios por estado</p>
              <BarChart data={aBarras(data.servicios.porEstado, LABEL_ESTADO_SERVICIO, COLOR_ESTADO_SERVICIO)} height={180} />
            </div>
          </div>

          {/* Cuentas por estado + top hospitales */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-background p-5">
                <p className="mb-4 text-sm font-semibold text-foreground">Pacientes por estado</p>
                <BarChart
                  data={aBarras(data.usuarios.pacientesPorEstado, LABEL_ESTADO_USUARIO, {
                    activo: CHART_COLORS.emerald,
                    pendiente: CHART_COLORS.amber,
                    suspendido: CHART_COLORS.red,
                    baja: CHART_COLORS.zinc,
                  })}
                  height={170}
                />
              </div>
              <div className="rounded-xl border border-border bg-background p-5">
                <p className="mb-4 text-sm font-semibold text-foreground">Cuidadores por estado</p>
                <BarChart
                  data={aBarras(data.usuarios.cuidadoresPorEstado, LABEL_ESTADO_USUARIO, {
                    activo: CHART_COLORS.emerald,
                    pendiente: CHART_COLORS.amber,
                    suspendido: CHART_COLORS.red,
                    baja: CHART_COLORS.zinc,
                  })}
                  height={170}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-5">
              <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4" />
                Top 15 hospitales por actividad
              </p>
              {data.topHospitales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay anuncios publicados.</p>
              ) : (
                <BarChart
                  orientation="horizontal"
                  data={data.topHospitales.map((h) => ({
                    label: h.nombre,
                    sublabel: h.ciudad,
                    value: h.totalAnuncios,
                    color: CHART_COLORS.sky,
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
