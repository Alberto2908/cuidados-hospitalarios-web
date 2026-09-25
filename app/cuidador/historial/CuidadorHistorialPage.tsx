"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { CalendarDays, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Estrellas } from "@/components/ui/estrellas";
import {
  etiquetaEstadoPostulacion,
  misPostulacionesConSeccion,
  retirarPostulacion,
  type MiPostulacion,
} from "@/lib/api/postulaciones";

const ESTADO_COLOR: Record<MiPostulacion["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  aceptada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rechazada: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  retirada: "bg-muted text-muted-foreground",
};

// Una vez la postulacion esta 'aceptada' (servicio creado), su propio
// estado se queda en "Aceptado por ambas partes" para siempre aunque el
// servicio avance a confirmado/completado/cancelado (ver V12 en el
// backend) -asi que la tarjeta usa el estado del servicio, mas fino,
// cuando existe (mismo patron que PacienteHistorialPage.tsx).
const ESTADO_SERVICIO_LABEL: Record<string, string> = {
  aceptado: "Aceptado",
  confirmado: "Confirmado (pagado)",
  pendiente_confirmacion: "Pendiente de confirmación",
  completado: "Completado",
  cancelado: "Cancelado",
};

const ESTADO_SERVICIO_COLOR: Record<string, string> = {
  aceptado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  confirmado: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  pendiente_confirmacion: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
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
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Mis postulaciones</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tus postulaciones activas y, debajo, el historial de las ya aceptadas y terminadas, rechazadas o retiradas.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !postulaciones || postulaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-sunken py-16 text-center text-sm text-muted-foreground shadow-inset-soft">
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
                    onRetirar={
                      p.estado === "pendiente" || p.estado === "aceptada"
                        ? () => retirarMutation.mutate(p.id)
                        : undefined
                    }
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
  // Dos motivos de aviso, misma tarjeta: contraoferta del paciente/familiar
  // sin responder (badge del navbar via contarEsperandoRespuestaCuidador), o
  // pago ya procesado/retenido sin ver (postulacion.nuevoServicioAceptado —
  // deliberadamente NO se activa solo con aceptar, ver TODO.md). Se marca en
  // la tarjeta concreta para saber de cual se trata si hay varias.
  const esperandoMiRespuesta = postulacion.estado === "pendiente" && postulacion.propuestoPor === "paciente";
  const [modalRetirarAbierto, setModalRetirarAbierto] = useState(false);

  return (
    <div className="flex items-stretch justify-between gap-3 rounded-2xl bg-card p-4 shadow-float transition-shadow duration-200 hover:shadow-[0_8px_24px_oklch(0.29_0.05_265/0.12)]">
      <Link href={`/paciente/anuncio/${postulacion.anuncioId}`} className="min-w-0 flex-1 hover:opacity-80">
        <p className="font-medium text-foreground text-sm">{postulacion.anuncioTitulo}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{postulacion.hospital.nombre}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{postulacion.precioHora} €/hora</span>
        </div>
      </Link>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            {(esperandoMiRespuesta || postulacion.nuevoServicioAceptado) && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                <MessageSquare className="h-3 w-3" />
                1
              </span>
            )}
            {postulacion.estadoServicio ? (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_SERVICIO_COLOR[postulacion.estadoServicio] ?? ESTADO_COLOR[postulacion.estado]}`}
              >
                {ESTADO_SERVICIO_LABEL[postulacion.estadoServicio] ?? postulacion.estadoServicio}
              </span>
            ) : (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_COLOR[postulacion.estado]}`}>
                {etiquetaEstadoPostulacion(postulacion, true)}
              </span>
            )}
          </div>
          {postulacion.miValoracion != null && (
            <span className="mt-2.5 flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              <Estrellas valor={postulacion.miValoracion} />
              {postulacion.miValoracion.toFixed(1)}
            </span>
          )}
        </div>

        {onRetirar && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="rounded-full"
            disabled={retirando}
            onClick={() => setModalRetirarAbierto(true)}
          >
            Retirar
          </Button>
        )}
      </div>

      {onRetirar && (
        <ConfirmDialog
          open={modalRetirarAbierto}
          onOpenChange={setModalRetirarAbierto}
          titulo="Retirar postulación"
          descripcion={`¿Seguro que quieres retirar tu postulación a "${postulacion.anuncioTitulo}"? Esta acción no se puede deshacer.`}
          textoConfirmar="Retirar postulación"
          confirmando={retirando}
          onConfirmar={() => {
            onRetirar();
            setModalRetirarAbierto(false);
          }}
        />
      )}
    </div>
  );
}
