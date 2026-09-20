"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { MapPin, MessageSquare } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cancelarAnuncio, misAnuncios, type MiAnuncio } from "@/lib/api/anuncios";
import { formatearFecha } from "@/lib/fecha";

// "Cubierto" (nombre interno del backend) se muestra como "Aceptado": es lo
// que entiende el paciente/familiar ("ya lo aceptó un cuidador"). El pago
// real via Stripe llegara mas adelante sin cambiar este estado.
const ESTADO_LABEL: Record<MiAnuncio["estado"], string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  cancelado: "Cancelado",
};

const ESTADO_COLOR: Record<MiAnuncio["estado"], string> = {
  activo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  cubierto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function PacienteHistorialPage() {
  const queryClient = useQueryClient();

  // Mismo staleTime/poll que el badge del navbar (misNotificacionesConteo):
  // sin esto, esta lista podia quedarse hasta 5 min desfasada (staleTime
  // global) frente al numero ya actualizado del navbar, mostrando un total
  // de notificaciones sin que ninguna tarjeta reflejara aun a que anuncio
  // pertenecia.
  const { data: anuncios, isLoading } = useQuery({
    queryKey: ["anuncios", "mios"],
    queryFn: misAnuncios,
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => cancelarAnuncio(id),
    onSuccess: () => {
      sileo.success({ title: "Anuncio cancelado" });
      queryClient.invalidateQueries({ queryKey: ["anuncios", "mios"] });
      queryClient.invalidateQueries({ queryKey: ["anuncios", "notificaciones-conteo"] });
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo cancelar", description: error.message }),
  });

  const activos = anuncios?.filter((a) => a.seccion === "activo") ?? [];
  const completados = anuncios?.filter((a) => a.seccion === "completado") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mis anuncios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus anuncios activos y, debajo, el historial de los que ya se completaron o cancelaron.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !anuncios || anuncios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          <p>Todavía no has publicado ningún anuncio.</p>
          <Link href="/paciente/anuncio/nuevo" className="mt-2 font-medium text-foreground underline underline-offset-2">
            Publica tu primer anuncio
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activos</h2>
            {activos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes anuncios activos ahora mismo.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activos.map((anuncio) => (
                  <TarjetaMiAnuncio
                    key={anuncio.id}
                    anuncio={anuncio}
                    onCancelar={() => cancelarMutation.mutate(anuncio.id)}
                    cancelando={cancelarMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h2>
            {completados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aquí aparecerán los anuncios ya completados o cancelados.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {completados.map((anuncio) => (
                  <TarjetaMiAnuncio key={anuncio.id} anuncio={anuncio} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TarjetaMiAnuncio({
  anuncio,
  onCancelar,
  cancelando,
}: {
  anuncio: MiAnuncio;
  onCancelar?: () => void;
  cancelando?: boolean;
}) {
  return (
    <div className="flex items-stretch justify-between gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm transition-all hover:bg-muted/40 hover:shadow-md">
      <Link href={`/paciente/anuncio/${anuncio.id}`} className="min-w-0 flex-1 hover:opacity-80">
        <p className="font-medium text-foreground text-sm">{anuncio.titulo}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{anuncio.hospital.nombre}</span>
        </div>
        {anuncio.franjas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {anuncio.franjas.map((f, i) => (
              <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">
                {formatearFecha(f.fecha)} · {f.diaEntero ? "Día entero" : `${f.horaDesde}–${f.horaHasta}`}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex flex-col items-end gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_COLOR[anuncio.estado]}`}>
            {ESTADO_LABEL[anuncio.estado]}
          </span>
          {anuncio.postulacionesPendientes > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              <MessageSquare className="h-3 w-3" />
              {anuncio.postulacionesPendientes}
            </span>
          )}
        </div>

        {anuncio.estado === "activo" && onCancelar && (
          <div className="flex gap-2">
            <Link href={`/paciente/anuncio/${anuncio.id}/editar`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Modificar
            </Link>
            <Button
              type="button"
              size="sm"
              disabled={cancelando}
              onClick={() => {
                if (confirm("¿Seguro que quieres cancelar este anuncio?")) {
                  onCancelar();
                }
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
