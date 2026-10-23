"use client";

import { estadoServicioMostrado, seccionVisible } from "@/lib/anuncio/horas";
import { useAhora } from "@/lib/ui/useAhora";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { MapPin, MessageSquare, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Estrellas } from "@/components/ui/estrellas";
import ModalResena from "@/components/anuncio/ModalResena";
import ModalPago from "@/components/pago/ModalPago";
import { BOTON_NEGRO, ModalIncidencia } from "@/components/pago/ConfirmacionCuidado";
import { borrarAnuncio, misAnuncios, type MiAnuncio } from "@/lib/api/anuncios";
import { crearResena } from "@/lib/api/resenas";
import { abrirIncidenciaServicio, confirmarServicio, type MotivoIncidencia } from "@/lib/api/servicios";
import { formatearFecha } from "@/lib/fecha";
import { cn } from "@/lib/utils";

// "Cubierto" (nombre interno del backend) se muestra como "Aceptado" SOLO
// cuando no hay todavia un estado de servicio mas especifico que mostrar
// (nunca deberia pasar en la practica, un anuncio 'cubierto' siempre tiene
// servicio, pero por si acaso). El pago real via Stripe llegara mas
// adelante sin cambiar este estado.
const ESTADO_LABEL: Record<MiAnuncio["estado"], string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  borrado: "Borrado",
};

const ESTADO_COLOR: Record<MiAnuncio["estado"], string> = {
  activo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  cubierto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  borrado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// Una vez el anuncio esta 'cubierto' (servicio creado), su propio estado
// del anuncio ya no basta -se queda en "Aceptado" para siempre aunque el
// servicio avance a confirmado/completado/cancelado (ver V12 en el backend)-
// asi que la tarjeta usa este estado, mas fino, cuando existe.
const ESTADO_SERVICIO_LABEL: Record<NonNullable<MiAnuncio["estadoServicio"]> | "en_curso" | "en_revision", string> = {
  aceptado: "Aceptado",
  confirmado: "Confirmado (pagado)",
  en_curso: "En curso",
  en_revision: "En revisión",
  pendiente_confirmacion: "Pendiente de confirmación",
  completado: "Completado",
  cancelado: "Cancelado",
};

const ESTADO_SERVICIO_COLOR: Record<NonNullable<MiAnuncio["estadoServicio"]> | "en_curso" | "en_revision", string> = {
  aceptado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  confirmado: "bg-accent text-accent-foreground",
  en_curso: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  en_revision: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  pendiente_confirmacion: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
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

  const borrarMutation = useMutation({
    mutationFn: ({ id, confirmaCancelacionTardia }: { id: string; confirmaCancelacionTardia: boolean }) =>
      borrarAnuncio(id, { confirmaCancelacionTardia }),
    onSuccess: () => {
      sileo.success({ title: "Anuncio borrado" });
      // Prefijo entero: ademas de "Mis anuncios" y las notificaciones, el
      // mapa/buscador ("busqueda", "conteo") no puede seguir mostrando el
      // anuncio recien borrado hasta que caduque su staleTime.
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo borrar", description: error.message }),
  });

  // Por fecha del cuidado (no de publicacion): arriba el primero que hay que
  // llevar a cabo en "Activos", y en el historial el mas reciente arriba.
  const porInicio = (a: MiAnuncio) => new Date(a.fechaInicioPrevista).getTime();
  const ahora = useAhora();
  const seccionDe = (a: MiAnuncio) =>
    seccionVisible(a.seccion === "activo" ? "activo" : "historial", a.estadoServicio, a.franjas, ahora);
  const enCurso = (anuncios?.filter((a) => seccionDe(a) === "en_curso") ?? []).sort((a, b) => porInicio(a) - porInicio(b));
  const activos = (anuncios?.filter((a) => seccionDe(a) === "activo") ?? []).sort((a, b) => porInicio(a) - porInicio(b));
  const completados = (anuncios?.filter((a) => seccionDe(a) === "historial") ?? []).sort((a, b) => porInicio(b) - porInicio(a));

  return (
    <div className="page-container py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Mis anuncios</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tus anuncios activos y, debajo, el historial de los que ya se completaron.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !anuncios || anuncios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-sunken py-16 text-center text-sm text-muted-foreground shadow-inset-soft">
          <p>Todavía no has publicado ningún anuncio.</p>
          <Link href="/paciente/anuncio/nuevo" className="mt-2 font-medium text-foreground underline underline-offset-2">
            Publica tu primer anuncio
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {enCurso.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">En curso</h2>
              <div className="flex flex-col gap-3">
                {enCurso.map((anuncio) => (
                  <TarjetaMiAnuncio key={anuncio.id} anuncio={anuncio} />
                ))}
              </div>
            </section>
          )}

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
                    onBorrar={(confirmaCancelacionTardia) => borrarMutation.mutate({ id: anuncio.id, confirmaCancelacionTardia })}
                    borrando={borrarMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h2>
            {completados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aquí aparecerán los anuncios ya completados.</p>
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
  onBorrar,
  borrando,
}: {
  anuncio: MiAnuncio;
  onBorrar?: (confirmaCancelacionTardia: boolean) => void;
  borrando?: boolean;
}) {
  const queryClient = useQueryClient();
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const [modalBorrarAbierto, setModalBorrarAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const [modalIncidenciaAbierto, setModalIncidenciaAbierto] = useState(false);
  const ahora = useAhora();
  const estadoMostrado = estadoServicioMostrado(anuncio.estadoServicio, anuncio.franjas, ahora, anuncio.incidenciaAbierta);
  // Aceptado pero sin pagar: el pago se puede hacer directamente desde esta lista.
  const puedePagar = anuncio.estadoServicio === "aceptado" && anuncio.servicioId !== null;
  // Que se puede hacer con el anuncio lo decide el backend (politicaBorrado):
  // "aviso" = aceptado y pagado, con poco tiempo para el inicio (ver politicaBorrado en el backend).
  const puedeBorrar = anuncio.politicaBorrado !== "bloqueado";
  const borradoConAviso = anuncio.politicaBorrado === "aviso";

  // Cuidado terminado y pendiente de confirmar: se confirma o se abre una incidencia desde la propia tarjeta.
  const porConfirmar = anuncio.estadoServicio === "pendiente_confirmacion" && anuncio.servicioId !== null;

  function refrescarTrasConfirmar() {
    queryClient.invalidateQueries({ queryKey: ["anuncios"] });
    queryClient.invalidateQueries({ queryKey: ["servicio", anuncio.servicioId] });
    queryClient.invalidateQueries({ queryKey: ["inscripciones", "anuncio", anuncio.id] });
  }

  const confirmarMutation = useMutation({
    mutationFn: () => confirmarServicio(anuncio.servicioId as string),
    onSuccess: () => {
      sileo.success({ title: "Cuidado confirmado", description: "El pago se ha entregado al cuidador." });
      setModalConfirmarAbierto(false);
      refrescarTrasConfirmar();
    },
    onError: (error: Error) => {
      setModalConfirmarAbierto(false);
      sileo.error({ title: "No se pudo confirmar", description: error.message });
    },
  });

  const incidenciaMutation = useMutation({
    mutationFn: (datos: { motivo: MotivoIncidencia; descripcion: string }) =>
      abrirIncidenciaServicio(anuncio.servicioId as string, datos),
    onSuccess: () => {
      sileo.success({
        title: "Incidencia enviada",
        description: "La plataforma la revisará. Mientras tanto el dinero sigue retenido.",
      });
      setModalIncidenciaAbierto(false);
      refrescarTrasConfirmar();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo abrir la incidencia", description: error.message }),
  });

  const crearResenaMutation = useMutation({
    mutationFn: (datos: { valoracion: number; comentario: string }) =>
      crearResena(anuncio.servicioId as string, datos.valoracion, datos.comentario),
    onSuccess: () => {
      sileo.success({ title: "Reseña enviada", description: "Gracias por valorar a tu cuidador." });
      setModalResenaAbierto(false);
      queryClient.invalidateQueries({ queryKey: ["anuncios", "mios"] });
      queryClient.invalidateQueries({ queryKey: ["anuncios", "notificaciones-conteo"] });
      queryClient.invalidateQueries({ queryKey: ["inscripciones", "anuncio", anuncio.id] });
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo enviar la reseña", description: error.message }),
  });

  return (
    <div className="flex items-stretch justify-between gap-3 rounded-2xl bg-card p-4 shadow-float transition-shadow duration-200 hover:shadow-[0_5px_16px_oklch(0.29_0.05_265/0.08)]">
      <Link href={`/paciente/anuncio/${anuncio.id}`} className="min-w-0 flex-1 hover:opacity-80">
        <p className="font-medium text-foreground text-sm">{anuncio.titulo}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{anuncio.hospital.nombre}</span>
        </div>
        {anuncio.franjas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {anuncio.franjas.map((f, i) => (
              <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                {formatearFecha(f.fecha)} · {f.diaEntero ? "Día entero" : `${f.horaDesde}–${f.horaHasta}`}
              </span>
            ))}
          </div>
        )}
        {anuncio.estadoServicio === "pendiente_confirmacion" && (
          <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
            {anuncio.incidenciaAbierta
              ? "Has abierto una incidencia: la plataforma la revisará y decidirá el reparto del pago."
              : "El cuidado ha terminado: confirma si se realizó correctamente."}
          </p>
        )}
      </Link>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            {anuncio.inscripcionesPendientes > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                <MessageSquare className="h-3 w-3" />
                {anuncio.inscripcionesPendientes}
              </span>
            )}
            {(anuncio.puedeValorar || (anuncio.estadoServicio === "pendiente_confirmacion" && !anuncio.incidenciaAbierta)) && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                1
              </span>
            )}
            {anuncio.estadoServicio ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_SERVICIO_COLOR[estadoMostrado ?? anuncio.estadoServicio]}`}
              >
                {ESTADO_SERVICIO_LABEL[estadoMostrado ?? anuncio.estadoServicio]}
              </span>
            ) : (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[anuncio.estado]}`}>
                {ESTADO_LABEL[anuncio.estado]}
              </span>
            )}
          </div>
          {anuncio.miValoracion != null ? (
            <span className="mt-2.5 flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              <Estrellas valor={anuncio.miValoracion} />
              {anuncio.miValoracion.toFixed(1)}
            </span>
          ) : (
            anuncio.puedeValorar && (
              <button
                type="button"
                onClick={() => setModalResenaAbierto(true)}
                className="mt-2.5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Star className="h-3 w-3" />
                Añadir reseña
              </button>
            )
          )}
        </div>

        {porConfirmar && !anuncio.incidenciaAbierta && (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn("rounded-full", BOTON_NEGRO)}
              onClick={() => setModalIncidenciaAbierto(true)}
            >
              Abrir incidencia
            </Button>
            <Button type="button" size="sm" className="rounded-full" onClick={() => setModalConfirmarAbierto(true)}>
              Confirmar
            </Button>
          </div>
        )}

        {((onBorrar && puedeBorrar) || puedePagar) && (
          <div className="flex gap-2">
            {anuncio.estado === "activo" && (
              <Link
                href={`/paciente/anuncio/${anuncio.id}/editar`}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-full")}
              >
                Modificar
              </Link>
            )}
            {puedePagar && (
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => setModalPagoAbierto(true)}
              >
                Pagar
              </Button>
            )}
            {onBorrar && puedeBorrar && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-full"
                disabled={borrando}
                onClick={() => setModalBorrarAbierto(true)}
              >
                Borrar
              </Button>
            )}
          </div>
        )}
      </div>

      {porConfirmar && (
        <>
          <ConfirmDialog
            open={modalConfirmarAbierto}
            onOpenChange={setModalConfirmarAbierto}
            titulo="Confirmar el cuidado"
            descripcion="Al confirmar, el pago se entrega al cuidador y ya no se puede recuperar desde la aplicación. Si ha habido algún problema con el cuidado, no lo confirmes y abre una incidencia."
            textoConfirmar="Confirmar cuidado"
            confirmando={confirmarMutation.isPending}
            onConfirmar={() => confirmarMutation.mutate()}
          />
          <ModalIncidencia
            open={modalIncidenciaAbierto}
            onOpenChange={setModalIncidenciaAbierto}
            enviando={incidenciaMutation.isPending}
            onEnviar={(datos) => incidenciaMutation.mutate(datos)}
          />
        </>
      )}

      {puedePagar && (
        <ModalPago
          key={modalPagoAbierto ? "pago-abierto" : "pago-cerrado"}
          open={modalPagoAbierto}
          onOpenChange={setModalPagoAbierto}
          servicioId={anuncio.servicioId}
          onPagado={() => {
            sileo.success({
              title: "Pago realizado",
              description: "El dinero queda retenido hasta que confirmes que el cuidado se ha realizado.",
            });
            setModalPagoAbierto(false);
            queryClient.invalidateQueries({ queryKey: ["anuncios", "mios"] });
            queryClient.invalidateQueries({ queryKey: ["anuncios", "notificaciones-conteo"] });
            queryClient.invalidateQueries({ queryKey: ["inscripciones", "anuncio", anuncio.id] });
          }}
        />
      )}

      {anuncio.puedeValorar && (
        <ModalResena
          key={modalResenaAbierto ? "resena-abierto" : "resena-cerrado"}
          open={modalResenaAbierto}
          onOpenChange={setModalResenaAbierto}
          cuidadorNombre={anuncio.cuidadorNombre ?? "tu cuidador"}
          enviando={crearResenaMutation.isPending}
          onEnviar={(valoracion, comentario) => crearResenaMutation.mutate({ valoracion, comentario })}
        />
      )}

      {onBorrar && (
        <ConfirmDialog
          open={modalBorrarAbierto}
          onOpenChange={setModalBorrarAbierto}
          titulo="Borrar anuncio"
          descripcion={
            borradoConAviso
              ? `Si borras "${anuncio.titulo}" con tan poco tiempo de antelación, el pago quedará retenido y la plataforma decidirá cuánto se te devuelve, por las molestias causadas al cuidador. ¿Quieres borrarlo igualmente? Esta acción no se puede deshacer.`
              : `¿Seguro que quieres borrar "${anuncio.titulo}"? Esta acción no se puede deshacer.`
          }
          textoConfirmar="Borrar anuncio"
          confirmando={borrando}
          onConfirmar={() => {
            onBorrar(borradoConAviso);
            setModalBorrarAbierto(false);
          }}
        />
      )}
    </div>
  );
}
