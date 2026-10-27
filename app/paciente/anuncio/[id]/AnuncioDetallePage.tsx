"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { ArrowLeft, CalendarDays, Lock, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cuidadorCompleto, itemsCompletitud } from "@/lib/cuidador/completitud";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import BotonVerPerfil from "@/components/perfil/BotonVerPerfil";
import ModalContraoferta from "@/components/anuncio/ModalContraoferta";
import ModalPago from "@/components/pago/ModalPago";
import ResumenPago from "@/components/pago/ResumenPago";
import ConfirmacionCuidado from "@/components/pago/ConfirmacionCuidado";
import ModalResena from "@/components/anuncio/ModalResena";
import { cuidadoEmpezado, estadoServicioMostrado, horasTotales, puedeRetirarseConPagoHecho } from "@/lib/anuncio/horas";
import { useAhora } from "@/lib/ui/useAhora";
import { formatearFecha } from "@/lib/fecha";
import type { FranjaHoraria } from "@/lib/anuncio/schema";
import {
  borrarAnuncio,
  obtenerAnuncio,
  type Anuncio,
} from "@/lib/api/anuncios";
import {
  aceptarInscripcion,
  actualizarPrecioInscripcion,
  etiquetaEstadoInscripcion,
  listarMisInscripciones,
  listarInscripcionesPorAnuncio,
  inscribirse,
  rechazarInscripcion,
  retirarInscripcion,
  type Inscripcion,
} from "@/lib/api/inscripciones";
import { crearResena } from "@/lib/api/resenas";
import { obtenerServicio, type EstadoServicio } from "@/lib/api/servicios";

// "Cubierto" (nombre interno del backend) se muestra como "Aceptado" SOLO
// cuando no hay ningun servicio todavia del que sacar un estado mas fino
// (no deberia pasar en la practica: un anuncio 'cubierto' siempre tiene
// servicio). El pago real via Stripe llegara mas adelante sin cambiar este
// estado del anuncio.
const ESTADO_LABEL: Record<Anuncio["estado"], string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  borrado: "Borrado",
};

const ESTADO_COLOR: Record<Anuncio["estado"], string> = {
  activo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  cubierto:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  borrado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// Una vez el anuncio esta 'cubierto', su propio estado se queda en
// "Aceptado" para siempre aunque el servicio avance a confirmado/
// pendiente_confirmacion/completado/cancelado (ver V12 en el backend) -> se
// usa este, mas fino, en cuanto existe.
const ESTADO_SERVICIO_LABEL: Record<EstadoServicio | "en_curso" | "en_revision", string> = {
  aceptado: "Aceptado",
  confirmado: "Confirmado (pagado)",
  en_curso: "En curso",
  en_revision: "En revisión",
  pendiente_confirmacion: "Pendiente de confirmación",
  completado: "Completado",
  cancelado: "Cancelado",
};

const ESTADO_SERVICIO_COLOR: Record<EstadoServicio | "en_curso" | "en_revision", string> = {
  aceptado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  confirmado: "bg-accent text-accent-foreground",
  en_curso: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  en_revision: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  pendiente_confirmacion: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function AnuncioDetallePage() {
  const params = useParams<{ id: string }>();
  const anuncioId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const anuncioQuery = useQuery({
    queryKey: ["anuncio", anuncioId],
    queryFn: () => obtenerAnuncio(anuncioId),
  });

  const anuncio = anuncioQuery.data;
  const esAutor = Boolean(user && anuncio && user.id === anuncio.usuarioId);
  const esCuidador = user?.rol === "CUIDADOR";

  const inscripcionesQuery = useQuery({
    queryKey: ["inscripciones", "anuncio", anuncioId],
    queryFn: () => listarInscripcionesPorAnuncio(anuncioId),
    enabled: esAutor,
  });

  const misInscripcionesQuery = useQuery({
    queryKey: ["inscripciones", "mias"],
    queryFn: listarMisInscripciones,
    enabled: esCuidador && !esAutor && cuidadorCompleto(user),
  });

  const miInscripcion = misInscripcionesQuery.data?.find(
    (p) => p.anuncioId === anuncioId,
  );

  // Estado del servicio (mas fino que anuncio.estado, ver ESTADO_SERVICIO_LABEL):
  // desde el lado autor, la inscripcion aceptada (como mucho una); desde el
  // lado cuidador, la propia.
  const estadoServicio =
    inscripcionesQuery.data?.find((p) => p.estado === "aceptada")?.estadoServicio
    ?? miInscripcion?.estadoServicio
    ?? null;
  const ahora = useAhora();
  // La incidencia abierta se lee del servicio (misma consulta que el recuadro de pago).
  const servicioIdCabecera =
    inscripcionesQuery.data?.find((p) => p.estado === "aceptada")?.servicioId ?? miInscripcion?.servicioId ?? null;
  const servicioCabeceraQuery = useQuery({
    queryKey: ["servicio", servicioIdCabecera],
    queryFn: () => obtenerServicio(servicioIdCabecera as string),
    enabled: Boolean(servicioIdCabecera),
  });
  const incidenciaAbierta =
    Boolean(servicioCabeceraQuery.data?.incidenciaAbiertaEn) && servicioCabeceraQuery.data?.estadoPago === "procesado";
  const estadoMostrado = estadoServicioMostrado(estadoServicio, anuncio?.franjas ?? [], ahora, incidenciaAbierta);

  function invalidarTodo() {
    queryClient.invalidateQueries({ queryKey: ["anuncio", anuncioId] });
    queryClient.invalidateQueries({
      queryKey: ["inscripciones", "anuncio", anuncioId],
    });
    queryClient.invalidateQueries({ queryKey: ["inscripciones", "mias"] });
    // El estado de este anuncio (activo/cubierto/borrado) tambien se
    // muestra en "Mis anuncios" y en el badge de notificaciones del navbar;
    // sin esto quedaban con datos obsoletos hasta que expirase el
    // staleTime global (5 min, ver QueryProvider.tsx).
    queryClient.invalidateQueries({ queryKey: ["anuncios", "mios"] });
    queryClient.invalidateQueries({
      queryKey: ["anuncios", "notificaciones-conteo"],
    });
    queryClient.invalidateQueries({
      queryKey: ["inscripciones", "notificaciones-conteo"],
    });
  }

  const borrarAnuncioMutation = useMutation({
    mutationFn: () => borrarAnuncio(anuncioId),
    onSuccess: () => {
      sileo.success({ title: "Anuncio borrado" });
      // El detalle de un anuncio borrado ya no existe (404): no tiene
      // sentido quedarse aqui refrescandolo.
      queryClient.removeQueries({ queryKey: ["anuncio", anuncioId] });
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
      queryClient.invalidateQueries({ queryKey: ["inscripciones"] });
      router.push("/paciente/historial");
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo borrar", description: error.message }),
  });

  if (anuncioQuery.isLoading) {
    return (
      <div className="page-container py-16 text-center text-sm text-muted-foreground">
        Cargando anuncio…
      </div>
    );
  }
  if (!anuncio) {
    return (
      <div className="page-container py-16 text-center text-sm text-muted-foreground">
        No se ha encontrado el anuncio.
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {anuncio.titulo}
          </h1>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {anuncio.hospital.nombre}
          </p>
          {!esAutor && (
            <p className="mt-2 text-sm text-muted-foreground">Publicado por {anuncio.pacienteNombre}</p>
          )}
        </div>
        {/* Estado arriba y, debajo, "Ver perfil" a la altura de "Publicado por…" */}
        <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              estadoMostrado ? ESTADO_SERVICIO_COLOR[estadoMostrado] : ESTADO_COLOR[anuncio.estado]
            }`}
          >
            {estadoMostrado ? ESTADO_SERVICIO_LABEL[estadoMostrado] : ESTADO_LABEL[anuncio.estado]}
          </span>
          {!esAutor && <BotonVerPerfil href={`/pacientes/${anuncio.usuarioId}`} />}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-float">
        <p className="text-sm leading-relaxed text-foreground">
          {anuncio.descripcion}
        </p>

        {anuncio.franjas && anuncio.franjas.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Días y horarios solicitados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {anuncio.franjas.map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                >
                  {formatearFecha(f.fecha)} ·{" "}
                  {f.diaEntero ? "Día entero" : `${f.horaDesde}–${f.horaHasta}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {anuncio.planta || anuncio.habitacion || anuncio.cama ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-sunken p-3 text-xs text-muted-foreground shadow-inset-soft">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Planta {anuncio.planta ?? "—"} · Habitación{" "}
              {anuncio.habitacion ?? "—"} · Cama {anuncio.cama ?? "—"}
            </span>
          </div>
        ) : !esAutor && anuncio.estado === "activo" ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-sunken p-3 text-xs text-muted-foreground shadow-inset-soft">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              La planta, habitación y cama son privadas hasta que se acepte una
              inscripción.
            </span>
          </div>
        ) : null}

        {esAutor && anuncio.estado === "activo" && (
          <div className="mt-5 flex justify-end gap-2">
            <Link href={`/paciente/anuncio/${anuncioId}/editar`} className={buttonVariants({ variant: "default", size: "sm" })}>
              Modificar anuncio
            </Link>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={borrarAnuncioMutation.isPending}
              onClick={() => {
                if (confirm("¿Seguro que quieres borrar este anuncio?")) {
                  borrarAnuncioMutation.mutate();
                }
              }}
            >
              Borrar anuncio
            </Button>
          </div>
        )}
      </div>

      {esAutor && (
        <SeccionInscripcionesAutor
          anuncioActivo={anuncio.estado === "activo"}
          franjas={anuncio.franjas ?? []}
          inscripciones={inscripcionesQuery.data ?? []}
          cargando={inscripcionesQuery.isLoading}
          onCambio={invalidarTodo}
        />
      )}

      {!esAutor && esCuidador && (
        <SeccionInscribirse
          anuncioId={anuncioId}
          anuncioActivo={anuncio.estado === "activo"}
          horas={horasTotales(anuncio.franjas ?? [])}
          franjas={anuncio.franjas ?? []}
          miTarifaHora={user?.tarifaHora ?? null}
          miInscripcion={miInscripcion}
          cargando={misInscripcionesQuery.isLoading}
          onCambio={invalidarTodo}
        />
      )}
    </div>
  );
}

function SeccionInscripcionesAutor({
  anuncioActivo,
  franjas,
  inscripciones,
  cargando,
  onCambio,
}: {
  anuncioActivo: boolean;
  franjas: FranjaHoraria[];
  inscripciones: Inscripcion[];
  cargando: boolean;
  onCambio: () => void;
}) {
  const horas = horasTotales(franjas);
  // Servicio cuyo pago esta abierto en el modal (null = cerrado). "Aceptar y
  // pagar" abre el modal en cuanto se acepta la inscripcion; si se cierra sin
  // pagar, queda el boton "Pagar" en la fila (el servicio sigue 'aceptado').
  const [servicioPagoId, setServicioPagoId] = useState<string | null>(null);
  const aceptarMutation = useMutation({
    mutationFn: (id: string) => aceptarInscripcion(id),
    onSuccess: (servicio) => {
      sileo.success({
        title: "Inscripción aceptada",
        description: `${servicio.cuidadorNombre} se encargará del servicio (${servicio.importeTotal} €). Falta completar el pago.`,
      });
      onCambio();
      setServicioPagoId(servicio.id);
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo aceptar", description: error.message }),
  });

  const rechazarMutation = useMutation({
    mutationFn: (id: string) => rechazarInscripcion(id),
    onSuccess: () => {
      sileo.success({ title: "Inscripción rechazada" });
      onCambio();
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo rechazar", description: error.message }),
  });

  const contraofertaMutation = useMutation({
    mutationFn: ({ id, precioHora }: { id: string; precioHora: number }) =>
      actualizarPrecioInscripcion(id, precioHora),
    onSuccess: () => {
      sileo.success({ title: "Contraoferta enviada" });
      onCambio();
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo enviar", description: error.message }),
  });

  return (
    <div className="mt-6 rounded-2xl bg-card p-6 shadow-float">
      <h2 className="text-lg font-semibold text-foreground">Inscripciones</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {anuncioActivo
          ? "Cuidadores que se han ofrecido para este anuncio."
          : "Este anuncio ya no admite nuevas inscripciones."}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : inscripciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay ninguna inscripción.
          </p>
        ) : (
          inscripciones.map((p) => (
            <FilaInscripcion
              key={p.id}
              inscripcion={p}
              horas={horas}
              puedeActuar={anuncioActivo}
              onAceptar={() => aceptarMutation.mutate(p.id)}
              onPagar={setServicioPagoId}
              onCambio={onCambio}
              onRechazar={() => rechazarMutation.mutate(p.id)}
              onContraoferta={(precioHora) =>
                contraofertaMutation.mutate({ id: p.id, precioHora })
              }
              pendienteAccion={
                aceptarMutation.isPending ||
                rechazarMutation.isPending ||
                contraofertaMutation.isPending
              }
            />
          ))
        )}
      </div>

      <ModalPago
        key={`pago-${servicioPagoId ?? "cerrado"}`}
        open={servicioPagoId !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setServicioPagoId(null);
          }
        }}
        servicioId={servicioPagoId}
        onPagado={() => {
          sileo.success({
            title: "Pago realizado",
            description: "El dinero queda retenido hasta que confirmes que el cuidado se ha realizado.",
          });
          setServicioPagoId(null);
          onCambio();
        }}
      />
    </div>
  );
}

function FilaInscripcion({
  inscripcion,
  horas,
  puedeActuar,
  onAceptar,
  onPagar,
  onCambio,
  onRechazar,
  onContraoferta,
  pendienteAccion,
}: {
  inscripcion: Inscripcion;
  horas: number;
  puedeActuar: boolean;
  onAceptar: () => void;
  onPagar: (servicioId: string) => void;
  onCambio: () => void;
  onRechazar: () => void;
  onContraoferta: (precioHora: number) => void;
  pendienteAccion: boolean;
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const esPendiente = inscripcion.estado === "pendiente";
  const importeTotal = Math.round(inscripcion.precioHora * horas * 100) / 100;
  // Se coloca junto al texto/boton de cada estado (Pagar, Añadir reseña,
  // "Rechazaste esta inscripción"…) en vez de siempre en su propia fila al
  // final, para que no quede huérfano. Solo se usa la fila de abajo cuando
  // no hay ningun bloque de estado (pendiente, o algun estado sin manejar).
  const tieneBloqueDeEstado =
    inscripcion.estado === "aceptada" ||
    inscripcion.estado === "rechazada" ||
    inscripcion.estado === "retirada";
  const botonVerPerfil = <BotonVerPerfil href={`/cuidadores/${inscripcion.cuidadorUsuarioId}`} />;

  const queryClient = useQueryClient();
  const crearResenaMutation = useMutation({
    mutationFn: (datos: { valoracion: number; comentario: string }) =>
      crearResena(inscripcion.servicioId as string, datos.valoracion, datos.comentario),
    onSuccess: () => {
      sileo.success({ title: "Reseña enviada", description: "Gracias por valorar a tu cuidador." });
      setModalResenaAbierto(false);
      queryClient.invalidateQueries({ queryKey: ["inscripciones", "anuncio", inscripcion.anuncioId] });
      queryClient.invalidateQueries({ queryKey: ["anuncios", "mios"] });
      queryClient.invalidateQueries({ queryKey: ["anuncios", "notificaciones-conteo"] });
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo enviar la reseña", description: error.message }),
  });

  return (
    <div className="rounded-xl bg-accent p-4 shadow-inset-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground text-sm">
          {inscripcion.cuidadorNombre}
        </p>
        <EstadoInscripcionBadge inscripcion={inscripcion} esCuidador={false} />
      </div>
      <p className="mt-1 text-sm text-foreground">
        Precio por hora: <strong>{inscripcion.precioHora} €</strong> (
        {inscripcion.propuestoPor === "cuidador"
          ? "enviado por el cuidador"
          : "enviado por ti"}
        )
      </p>
      <p className="text-sm text-foreground">
        Coste total para este servicio ({horas}h): <strong>{importeTotal} €</strong>
      </p>

      {inscripcion.estado === "aceptada" && inscripcion.estadoServicio === "aceptado" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {inscripcion.propuestoPor === "cuidador"
              ? `Aceptaste la propuesta de ${inscripcion.cuidadorNombre}. Falta completar el pago.`
              : `${inscripcion.cuidadorNombre} aceptó tu propuesta. Falta completar el pago.`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!inscripcion.servicioId}
              onClick={() => inscripcion.servicioId && onPagar(inscripcion.servicioId)}
            >
              Pagar
            </Button>
            {botonVerPerfil}
          </div>
        </div>
      )}
      {inscripcion.estado === "aceptada" && inscripcion.estadoServicio === "confirmado" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent p-3">
          <p className="text-sm text-accent-foreground">
            Pago realizado. El cuidado está en marcha.
          </p>
          {botonVerPerfil}
        </div>
      )}
      {inscripcion.estado === "aceptada" && inscripcion.estadoServicio === "pendiente_confirmacion" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            El turno ha terminado. Pendiente de que confirmes que el cuidado se realizó correctamente.
          </p>
          {botonVerPerfil}
        </div>
      )}
      {inscripcion.estado === "aceptada" && inscripcion.estadoServicio === "completado" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {inscripcion.tieneResena ? "Cuidado completado. Ya has valorado a este cuidador." : "Cuidado completado."}
          </p>
          <div className="flex items-center gap-2">
            {!inscripcion.tieneResena && (
              <Button type="button" size="sm" onClick={() => setModalResenaAbierto(true)}>
                Añadir reseña
              </Button>
            )}
            {botonVerPerfil}
          </div>
        </div>
      )}
      {inscripcion.estado === "aceptada" && inscripcion.estadoServicio === "cancelado" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            Este servicio fue cancelado.
          </p>
          {botonVerPerfil}
        </div>
      )}
      {inscripcion.estado === "aceptada" && inscripcion.servicioId && inscripcion.estadoServicio && (
        <>
          <ResumenPago servicioId={inscripcion.servicioId} rol="paciente" />
          {(inscripcion.estadoServicio === "confirmado" || inscripcion.estadoServicio === "pendiente_confirmacion") && (
            <ConfirmacionCuidado servicioId={inscripcion.servicioId} rol="paciente" onCambio={onCambio} />
          )}
        </>
      )}
      {inscripcion.estado === "rechazada" && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Rechazaste esta inscripción.</p>
          {botonVerPerfil}
        </div>
      )}
      {inscripcion.estado === "retirada" && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{inscripcion.cuidadorNombre} retiró su inscripción.</p>
          {botonVerPerfil}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {esPendiente && puedeActuar && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-0 bg-foreground text-background hover:bg-foreground/90"
              disabled={pendienteAccion}
              onClick={() => setModalAbierto(true)}
            >
              Contraofertar
            </Button>
            {inscripcion.propuestoPor === "cuidador" ? (
              // Acepta la inscripcion (crea el servicio, sin cobrar todavia) y abre
              // enseguida el modal de pago (ver aceptarMutation en
              // SeccionInscripcionesAutor). El servicio no queda confirmado hasta que
              // Stripe avisa del cobro.
              <Button
                type="button"
                size="sm"
                disabled={pendienteAccion}
                onClick={onAceptar}
              >
                Aceptar y pagar
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Esperando la respuesta del cuidador a tu propuesta.
              </p>
            )}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={pendienteAccion}
              onClick={onRechazar}
            >
              Rechazar
            </Button>
          </>
        )}
        {!tieneBloqueDeEstado && <div className="ml-auto">{botonVerPerfil}</div>}
      </div>

      <ModalContraoferta
        key={`contraoferta-${modalAbierto ? "abierto" : "cerrado"}`}
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        horas={horas}
        precioHoraInicial={inscripcion.precioHora}
        enviando={pendienteAccion}
        onEnviar={(precioHora) => {
          onContraoferta(precioHora);
          setModalAbierto(false);
        }}
      />

      <ModalResena
        key={`resena-${modalResenaAbierto ? "abierto" : "cerrado"}`}
        open={modalResenaAbierto}
        onOpenChange={setModalResenaAbierto}
        cuidadorNombre={inscripcion.cuidadorNombre}
        enviando={crearResenaMutation.isPending}
        onEnviar={(valoracion, comentario) => crearResenaMutation.mutate({ valoracion, comentario })}
      />
    </div>
  );
}

function SeccionInscribirse({
  anuncioId,
  anuncioActivo,
  horas,
  franjas,
  miTarifaHora,
  miInscripcion,
  cargando,
  onCambio,
}: {
  anuncioId: string;
  anuncioActivo: boolean;
  horas: number;
  franjas: FranjaHoraria[];
  miTarifaHora: number | null;
  miInscripcion: Inscripcion | undefined;
  cargando: boolean;
  onCambio: () => void;
}) {
  const { user } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);

  const inscribirseMutation = useMutation({
    mutationFn: () => inscribirse(anuncioId),
    onSuccess: () => {
      sileo.success({
        title: "Te has inscrito",
        description: "El paciente/familiar podrá revisar tu propuesta.",
      });
      onCambio();
    },
    onError: (error: Error) =>
      sileo.error({
        title: "No se pudo enviar la inscripción",
        description: error.message,
      }),
  });

  const aceptarMutation = useMutation({
    mutationFn: () => aceptarInscripcion(miInscripcion!.id),
    onSuccess: (servicio) => {
      sileo.success({
        title: "Propuesta aceptada",
        description: `Servicio confirmado por ${servicio.importeTotal} €.`,
      });
      onCambio();
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo aceptar", description: error.message }),
  });

  const contraofertaMutation = useMutation({
    mutationFn: (precioHora: number) =>
      actualizarPrecioInscripcion(miInscripcion!.id, precioHora),
    onSuccess: () => {
      sileo.success({ title: "Nueva propuesta enviada" });
      onCambio();
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo enviar", description: error.message }),
  });

  const [modalRetirarAbierto, setModalRetirarAbierto] = useState(false);
  // Reloj para que el boton "Retirar" se deshabilite solo al llegar al limite, sin recargar.
  const ahora = useAhora();
  // Servicio ya cobrado (el dinero esta retenido): la retirada devuelve el pago.
  const pagado =
    miInscripcion?.estadoServicio === "confirmado" || miInscripcion?.estadoServicio === "pendiente_confirmacion";
  // Con el pago hecho solo se puede retirar hasta 30 min antes del inicio; despues el
  // boton queda deshabilitado con la explicacion (el backend tambien lo exige).
  const retiradaCerrada = pagado && !puedeRetirarseConPagoHecho(franjas, ahora);
  // Una vez empezado el cuidado ya no se ofrece retirarse (queda la incidencia/queja).
  const servicioRetirable =
    miInscripcion?.estadoServicio === "aceptado" || miInscripcion?.estadoServicio === "confirmado";
  const retiradaOculta = !servicioRetirable || (pagado && cuidadoEmpezado(franjas, ahora));

  const retirarMutation = useMutation({
    mutationFn: () => retirarInscripcion(miInscripcion!.id),
    onSuccess: () => {
      sileo.success({ title: "Inscripción retirada" });
      onCambio();
    },
    onError: (error: Error) =>
      sileo.error({ title: "No se pudo retirar", description: error.message }),
  });

  if (cargando) {
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-float text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!anuncioActivo && !miInscripcion) {
    return null;
  }

  if (!miInscripcion && user && !cuidadorCompleto(user)) {
    const pendientes = itemsCompletitud(user).filter((i) => !i.hecho);
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-float">
        <h2 className="text-lg font-semibold text-foreground">Tu inscripción</h2>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Para inscribirte tienes que completar antes tu perfil de cuidador en{" "}
          <Link href="/perfil" className="font-medium underline underline-offset-2">
            tu perfil
          </Link>
          . Te falta: {pendientes.map((p) => p.label.toLowerCase()).join(", ")}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-card p-6 shadow-float">
      <h2 className="text-lg font-semibold text-foreground">Tu inscripción</h2>

      {!miInscripcion ? (
        anuncioActivo &&
        (miTarifaHora == null ? (
          <p className="mt-3 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Antes de inscribirte, fija tu tarifa por hora en{" "}
            <Link
              href="/perfil"
              className="font-medium text-foreground underline underline-offset-2"
            >
              tu perfil
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-foreground">
              Te inscribirás con tu tarifa:{" "}
              <strong>{miTarifaHora} €/hora</strong>
            </p>
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={inscribirseMutation.isPending}
              onClick={() => inscribirseMutation.mutate()}
            >
              Inscribirme
            </Button>
          </div>
        ))
      ) : (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base text-foreground">
              Precio propuesto:{" "}
              <strong>{miInscripcion.precioHora} €/hora</strong> (
              {miInscripcion.propuestoPor === "cuidador"
                ? "enviado por ti"
                : "enviado por el paciente/familiar"}
              )
            </p>
            <EstadoInscripcionBadge inscripcion={miInscripcion} esCuidador />
          </div>
          <p className="text-base text-foreground">
            Coste total para este servicio ({horas}h):{" "}
            <strong>{Math.round(miInscripcion.precioHora * horas * 100) / 100} €</strong>
          </p>

          {miInscripcion.estado === "aceptada" && miInscripcion.servicioId && miInscripcion.estadoServicio && (
            <>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <ResumenPago servicioId={miInscripcion.servicioId} rol="cuidador" className="w-fit" />
                {!retiradaOculta && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={retirarMutation.isPending || retiradaCerrada}
                    onClick={() => (pagado ? setModalRetirarAbierto(true) : retirarMutation.mutate())}
                  >
                    Retirar
                  </Button>
                )}
              </div>
              {!retiradaOculta && (
              <p className="mt-2 text-xs text-muted-foreground">
                {retiradaCerrada
                  ? "Ya no puedes retirarte: el cuidado empieza en menos de 30 minutos o ya ha empezado. Si no puedes asistir, ponte en contacto con nosotros."
                  : pagado
                    ? "Puedes retirarte hasta 30 minutos antes de que empiece el cuidado: se devolverá el pago íntegro."
                    : "Puedes retirarte antes de que se complete el pago."}
              </p>
              )}
              <ConfirmacionCuidado servicioId={miInscripcion.servicioId} rol="cuidador" />
            </>
          )}

          {miInscripcion.estado === "pendiente" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {miInscripcion.estado === "pendiente" && miInscripcion.propuestoPor === "paciente" && (
                <Button
                  type="button"
                  size="sm"
                  disabled={aceptarMutation.isPending}
                  onClick={() => aceptarMutation.mutate()}
                >
                  Aceptar
                </Button>
              )}
              {miInscripcion.estado === "pendiente" && (
                <Button
                  type="button"
                  size="sm"
                  variant={
                    miInscripcion.propuestoPor === "paciente"
                      ? "outline"
                      : "default"
                  }
                  disabled={contraofertaMutation.isPending}
                  onClick={() => setModalAbierto(true)}
                >
                  Enviar nueva propuesta
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={retirarMutation.isPending}
                onClick={() => retirarMutation.mutate()}
              >
                Retirar
              </Button>
              {miInscripcion.estado === "pendiente" && miInscripcion.propuestoPor === "cuidador" && (
                <p className="text-xs text-muted-foreground">
                  Esperando la respuesta del paciente/familiar a tu propuesta.
                </p>
              )}
            </div>
          )}

          <ConfirmDialog
            open={modalRetirarAbierto}
            onOpenChange={setModalRetirarAbierto}
            titulo="Retirarte del cuidado"
            descripcion="Se devolverá el pago íntegro y el anuncio volverá a publicarse. Retirarte de un cuidado ya pagado puede tener penalizaciones en el futuro. Esta acción no se puede deshacer."
            textoConfirmar="Retirarme"
            confirmando={retirarMutation.isPending}
            onConfirmar={() => {
              retirarMutation.mutate();
              setModalRetirarAbierto(false);
            }}
          />

          <ModalContraoferta
            key={modalAbierto ? "abierto" : "cerrado"}
            open={modalAbierto}
            onOpenChange={setModalAbierto}
            horas={horas}
            precioHoraInicial={miInscripcion.precioHora}
            enviando={contraofertaMutation.isPending}
            onEnviar={(precioHora) => {
              contraofertaMutation.mutate(precioHora);
              setModalAbierto(false);
            }}
          />

          {miInscripcion.estado === "rechazada" && (
            <p className="mt-2 text-sm text-muted-foreground">
              El paciente/familiar rechazó tu inscripción para este anuncio.
            </p>
          )}
          {miInscripcion.estado === "retirada" && (
            <p className="mt-2 text-sm text-muted-foreground">Retiraste tu inscripción.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EstadoInscripcionBadge({
  inscripcion,
  esCuidador,
}: {
  inscripcion: Pick<Inscripcion, "estado" | "aceptadoPorCuidador" | "aceptadoPorPaciente" | "estadoServicio">;
  esCuidador: boolean;
}) {
  const color: Record<Inscripcion["estado"], string> = {
    pendiente:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    aceptada:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rechazada: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    retirada:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${color[inscripcion.estado]}`}
    >
      {etiquetaEstadoInscripcion(inscripcion, esCuidador)}
    </span>
  );
}
