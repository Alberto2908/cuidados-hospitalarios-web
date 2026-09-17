"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { misPostulacionesConSeccion, retirarPostulacion, type MiPostulacion } from "@/lib/api/postulaciones";

const ESTADO_LABEL: Record<MiPostulacion["estado"], string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  retirada: "Retirada",
};

const ESTADO_COLOR: Record<MiPostulacion["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  aceptada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rechazada: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  retirada: "bg-muted text-muted-foreground",
};

const ESTADO_SERVICIO_LABEL: Record<string, string> = {
  en_curso: "En curso",
  pendiente_confirmacion: "Pendiente de confirmación",
  confirmado: "Confirmado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

export default function CuidadorHistorialPage() {
  const queryClient = useQueryClient();
  const { data: postulaciones, isLoading } = useQuery({
    queryKey: ["postulaciones", "mias", "historial"],
    queryFn: misPostulacionesConSeccion,
  });

  const retirarMutation = useMutation({
    mutationFn: (id: string) => retirarPostulacion(id),
    onSuccess: () => {
      sileo.success({ title: "Postulación retirada" });
      queryClient.invalidateQueries({ queryKey: ["postulaciones", "mias", "historial"] });
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo retirar", description: error.message }),
  });

  const activas = postulaciones?.filter((p) => p.seccion === "activo") ?? [];
  const historial = postulaciones?.filter((p) => p.seccion === "historial") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mis postulaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus postulaciones activas y, debajo, el historial de las ya aceptadas y terminadas, rechazadas o retiradas.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !postulaciones || postulaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          <p>Todavía no te has postulado a ningún anuncio.</p>
          <Link href="/cuidador/buscar" className="mt-2 font-medium text-foreground underline underline-offset-2">
            Busca anuncios activos
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activas</h2>
            {activas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes postulaciones activas ahora mismo.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activas.map((p) => (
                  <TarjetaMiPostulacion
                    key={p.id}
                    postulacion={p}
                    onRetirar={p.estado === "pendiente" ? () => retirarMutation.mutate(p.id) : undefined}
                    retirando={retirarMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h2>
            {historial.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aquí aparecerán tus postulaciones ya terminadas, rechazadas o retiradas.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {historial.map((p) => (
                  <TarjetaMiPostulacion key={p.id} postulacion={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TarjetaMiPostulacion({
  postulacion,
  onRetirar,
  retirando,
}: {
  postulacion: MiPostulacion;
  onRetirar?: () => void;
  retirando?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm">
      <Link href={`/paciente/anuncio/${postulacion.anuncioId}`} className="min-w-0 flex-1 hover:opacity-80">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm">{postulacion.anuncioTitulo}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_COLOR[postulacion.estado]}`}>
            {ESTADO_LABEL[postulacion.estado]}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{postulacion.hospital.nombre}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>
            {postulacion.precioHora} €/hora
            {postulacion.estadoServicio && ` · ${ESTADO_SERVICIO_LABEL[postulacion.estadoServicio] ?? postulacion.estadoServicio}`}
          </span>
        </div>
      </Link>

      {onRetirar && (
        <Button type="button" size="sm" variant="destructive" disabled={retirando} onClick={onRetirar}>
          Retirar
        </Button>
      )}
    </div>
  );
}
