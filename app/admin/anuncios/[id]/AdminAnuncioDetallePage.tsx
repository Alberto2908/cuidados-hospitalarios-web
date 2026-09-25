"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { ArrowLeft, CalendarDays, Lock, MapPin } from "lucide-react";
import { fetchAdminAnuncio, cancelarAnuncioAdmin } from "@/lib/api/admin";
import type { Postulacion } from "@/lib/api/postulaciones";
import type { EstadoAnuncio } from "@/lib/api/anuncios";
import type { EstadoPago, EstadoServicio } from "@/lib/api/servicios";
import { formatearFecha } from "@/lib/fecha";
import { Button } from "@/components/ui/button";

const ESTADO_SERVICIO_LABEL: Record<EstadoServicio, string> = {
  aceptado: "Aceptado",
  confirmado: "Confirmado (pagado)",
  pendiente_confirmacion: "Pendiente de confirmación",
  completado: "Completado",
  cancelado: "Cancelado",
};

const ESTADO_PAGO_LABEL: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  procesado: "Procesado",
  fallido: "Fallido",
};

const ESTADO_ANUNCIO_LABEL: Record<EstadoAnuncio, string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  cancelado: "Cancelado",
};

const ESTADO_ANUNCIO_COLOR: Record<EstadoAnuncio, string> = {
  activo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  cubierto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ESTADO_POSTULACION_LABEL: Record<Postulacion["estado"], string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  retirada: "Retirada",
};

const ESTADO_POSTULACION_COLOR: Record<Postulacion["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  aceptada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rechazada: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  retirada: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function AdminAnuncioDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const anuncioId = params.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "anuncios", anuncioId],
    queryFn: () => fetchAdminAnuncio(anuncioId),
    retry: false,
  });

  const cancelarMutation = useMutation({
    mutationFn: () => cancelarAnuncioAdmin(anuncioId),
    onSuccess: () => {
      sileo.success({ title: "Anuncio cancelado" });
      queryClient.invalidateQueries({ queryKey: ["admin", "anuncios"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "anuncios", anuncioId] });
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo cancelar", description: error.message }),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando anuncio…</p>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No se ha encontrado este anuncio.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">{data.anuncio.titulo}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {data.anuncio.hospital.nombre} · {data.anuncio.hospital.ciudad}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">Publicado por {data.anuncio.pacienteNombre}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTADO_ANUNCIO_COLOR[data.anuncio.estado]}`}>
              {ESTADO_ANUNCIO_LABEL[data.anuncio.estado]}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <p className="text-sm leading-relaxed text-foreground">{data.anuncio.descripcion}</p>

            {data.anuncio.franjas.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Días y horarios solicitados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.anuncio.franjas.map((f, i) => (
                    <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                      {formatearFecha(f.fecha)} · {f.diaEntero ? "Día entero" : `${f.horaDesde.slice(0, 5)}–${f.horaHasta.slice(0, 5)}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Planta {data.anuncio.planta ?? "—"} · Habitación {data.anuncio.habitacion ?? "—"} · Cama {data.anuncio.cama ?? "—"}
              </span>
            </div>

            {data.anuncio.estado === "activo" && (
              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={cancelarMutation.isPending}
                  onClick={() => {
                    if (confirm("¿Seguro que quieres cancelar este anuncio? Se rechazarán sus postulaciones pendientes.")) {
                      cancelarMutation.mutate();
                    }
                  }}
                >
                  Cancelar anuncio
                </Button>
              </div>
            )}
          </div>

          {data.servicio && (
            <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servicio</p>
              <div className="flex flex-col gap-1 text-sm text-foreground">
                <p>
                  {data.servicio.cuidadorNombre} · {data.servicio.precioHoraAcordado} €/hora · {data.servicio.horasTotales}h ·{" "}
                  <strong>{data.servicio.importeTotal} €</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Estado: {ESTADO_SERVICIO_LABEL[data.servicio.estado]} · Pago: {ESTADO_PAGO_LABEL[data.servicio.estadoPago]}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Postulaciones ({data.postulaciones.length})
            </p>
            {data.postulaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay ninguna postulación.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.postulaciones.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{p.cuidadorNombre}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_POSTULACION_COLOR[p.estado]}`}>
                        {ESTADO_POSTULACION_LABEL[p.estado]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.precioHora} €/hora · propuesto por {p.propuestoPor === "cuidador" ? "el cuidador" : "el paciente/familiar"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
