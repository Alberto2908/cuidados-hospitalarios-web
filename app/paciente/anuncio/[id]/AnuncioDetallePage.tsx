"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { ArrowLeft, CalendarDays, Lock, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { horasTotales } from "@/lib/anuncio/horas";
import type { FranjaHoraria } from "@/lib/anuncio/schema";
import {
  cancelarAnuncio,
  obtenerAnuncio,
  type Anuncio,
} from "@/lib/api/anuncios";
import {
  aceptarPostulacion,
  actualizarPrecioPostulacion,
  listarMisPostulaciones,
  listarPostulacionesPorAnuncio,
  postularse,
  rechazarPostulacion,
  retirarPostulacion,
  type Postulacion,
} from "@/lib/api/postulaciones";

const ESTADO_LABEL: Record<Anuncio["estado"], string> = {
  activo: "Activo",
  cubierto: "Cubierto",
  cancelado: "Cancelado",
};

const ESTADO_COLOR: Record<Anuncio["estado"], string> = {
  activo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cubierto: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
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

  const postulacionesQuery = useQuery({
    queryKey: ["postulaciones", "anuncio", anuncioId],
    queryFn: () => listarPostulacionesPorAnuncio(anuncioId),
    enabled: esAutor,
  });

  const misPostulacionesQuery = useQuery({
    queryKey: ["postulaciones", "mias"],
    queryFn: listarMisPostulaciones,
    enabled: esCuidador && !esAutor,
  });

  const miPostulacion = misPostulacionesQuery.data?.find((p) => p.anuncioId === anuncioId);

  function invalidarTodo() {
    queryClient.invalidateQueries({ queryKey: ["anuncio", anuncioId] });
    queryClient.invalidateQueries({ queryKey: ["postulaciones", "anuncio", anuncioId] });
    queryClient.invalidateQueries({ queryKey: ["postulaciones", "mias"] });
    // El estado de este anuncio (activo/cubierto/cancelado) tambien se
    // muestra en "Mis anuncios" y en el badge de notificaciones del navbar;
    // sin esto quedaban con datos obsoletos hasta que expirase el
    // staleTime global (5 min, ver QueryProvider.tsx).
    queryClient.invalidateQueries({ queryKey: ["anuncios", "mios"] });
    queryClient.invalidateQueries({ queryKey: ["anuncios", "notificaciones-conteo"] });
  }

  const cancelarAnuncioMutation = useMutation({
    mutationFn: () => cancelarAnuncio(anuncioId),
    onSuccess: () => {
      sileo.success({ title: "Anuncio cancelado" });
      invalidarTodo();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo cancelar", description: error.message }),
  });

  if (anuncioQuery.isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">Cargando anuncio…</div>;
  }
  if (!anuncio) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">No se ha encontrado el anuncio.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{anuncio.titulo}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {anuncio.hospital.nombre}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTADO_COLOR[anuncio.estado]}`}>
          {ESTADO_LABEL[anuncio.estado]}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-foreground">{anuncio.descripcion}</p>

        {anuncio.franjas && anuncio.franjas.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Días y horarios solicitados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {anuncio.franjas.map((f, i) => (
                <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                  {f.fecha} · {f.diaEntero ? "Día entero" : `${f.horaDesde}–${f.horaHasta}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {(anuncio.planta || anuncio.habitacion || anuncio.cama) ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Planta {anuncio.planta ?? "—"} · Habitación {anuncio.habitacion ?? "—"} · Cama {anuncio.cama ?? "—"}
            </span>
          </div>
        ) : !esAutor && anuncio.estado === "activo" ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>La planta, habitación y cama son privadas hasta que se acepte una postulación.</span>
          </div>
        ) : null}

        {esAutor && anuncio.estado === "activo" && (
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={cancelarAnuncioMutation.isPending}
              onClick={() => {
                if (confirm("¿Seguro que quieres cancelar este anuncio?")) {
                  cancelarAnuncioMutation.mutate();
                }
              }}
            >
              Cancelar anuncio
            </Button>
          </div>
        )}
      </div>

      {esAutor && (
        <SeccionPostulacionesAutor
          anuncioActivo={anuncio.estado === "activo"}
          franjas={anuncio.franjas ?? []}
          postulaciones={postulacionesQuery.data ?? []}
          cargando={postulacionesQuery.isLoading}
          onCambio={invalidarTodo}
          onAceptada={() => router.push("/paciente/buscar")}
        />
      )}

      {!esAutor && esCuidador && (
        <SeccionPostularse
          anuncioId={anuncioId}
          anuncioActivo={anuncio.estado === "activo"}
          miTarifaHora={user?.tarifaHora ?? null}
          miPostulacion={miPostulacion}
          cargando={misPostulacionesQuery.isLoading}
          onCambio={invalidarTodo}
        />
      )}
    </div>
  );
}

function SeccionPostulacionesAutor({
  anuncioActivo,
  franjas,
  postulaciones,
  cargando,
  onCambio,
  onAceptada,
}: {
  anuncioActivo: boolean;
  franjas: FranjaHoraria[];
  postulaciones: Postulacion[];
  cargando: boolean;
  onCambio: () => void;
  onAceptada: () => void;
}) {
  const horas = horasTotales(franjas);
  const aceptarMutation = useMutation({
    mutationFn: (id: string) => aceptarPostulacion(id),
    onSuccess: (servicio) => {
      sileo.success({
        title: "Postulación aceptada",
        description: `${servicio.cuidadorNombre} se encargará del servicio (${servicio.importeTotal} €).`,
      });
      onCambio();
      onAceptada();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo aceptar", description: error.message }),
  });

  const rechazarMutation = useMutation({
    mutationFn: (id: string) => rechazarPostulacion(id),
    onSuccess: () => {
      sileo.success({ title: "Postulación rechazada" });
      onCambio();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo rechazar", description: error.message }),
  });

  const contraofertaMutation = useMutation({
    mutationFn: ({ id, precioHora }: { id: string; precioHora: number }) => actualizarPrecioPostulacion(id, precioHora),
    onSuccess: () => {
      sileo.success({ title: "Contraoferta enviada" });
      onCambio();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo enviar", description: error.message }),
  });

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Postulaciones</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {anuncioActivo ? "Cuidadores que se han ofrecido para este anuncio." : "Este anuncio ya no admite nuevas postulaciones."}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : postulaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay ninguna postulación.</p>
        ) : (
          postulaciones.map((p) => (
            <FilaPostulacion
              key={p.id}
              postulacion={p}
              horas={horas}
              puedeActuar={anuncioActivo}
              onAceptar={() => aceptarMutation.mutate(p.id)}
              onRechazar={() => rechazarMutation.mutate(p.id)}
              onContraoferta={(precioHora) => contraofertaMutation.mutate({ id: p.id, precioHora })}
              pendienteAccion={aceptarMutation.isPending || rechazarMutation.isPending || contraofertaMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilaPostulacion({
  postulacion,
  horas,
  puedeActuar,
  onAceptar,
  onRechazar,
  onContraoferta,
  pendienteAccion,
}: {
  postulacion: Postulacion;
  horas: number;
  puedeActuar: boolean;
  onAceptar: () => void;
  onRechazar: () => void;
  onContraoferta: (precioHora: number) => void;
  pendienteAccion: boolean;
}) {
  const [precio, setPrecio] = useState(String(postulacion.precioHora));
  const esPendiente = postulacion.estado === "pendiente";
  const importeTotal = Math.round(postulacion.precioHora * horas * 100) / 100;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground text-sm">{postulacion.cuidadorNombre}</p>
        <EstadoPostulacionBadge estado={postulacion.estado} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Precio propuesto: <strong className="text-foreground">{postulacion.precioHora} €/hora</strong>{" "}
        ({postulacion.propuestoPor === "cuidador" ? "enviado por el cuidador" : "enviado por ti"})
      </p>
      <p className="text-xs text-muted-foreground">
        Coste total para este anuncio ({horas}h): <strong className="text-foreground">{importeTotal} €</strong>
      </p>

      {esPendiente && puedeActuar && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min="0.01"
            step="0.5"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="h-8 w-28 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pendienteAccion}
            onClick={() => onContraoferta(Number(precio))}
          >
            Contraofertar
          </Button>
          <Button type="button" size="sm" disabled={pendienteAccion} onClick={onAceptar}>
            Aceptar
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pendienteAccion} onClick={onRechazar}>
            Rechazar
          </Button>
        </div>
      )}
    </div>
  );
}

function SeccionPostularse({
  anuncioId,
  anuncioActivo,
  miTarifaHora,
  miPostulacion,
  cargando,
  onCambio,
}: {
  anuncioId: string;
  anuncioActivo: boolean;
  miTarifaHora: number | null;
  miPostulacion: Postulacion | undefined;
  cargando: boolean;
  onCambio: () => void;
}) {
  const [precio, setPrecio] = useState("");

  const postularseMutation = useMutation({
    mutationFn: () => postularse(anuncioId),
    onSuccess: () => {
      sileo.success({ title: "Te has postulado", description: "El paciente/familiar podrá revisar tu propuesta." });
      onCambio();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo enviar la postulación", description: error.message }),
  });

  const contraofertaMutation = useMutation({
    mutationFn: (precioHora: number) => actualizarPrecioPostulacion(miPostulacion!.id, precioHora),
    onSuccess: () => {
      sileo.success({ title: "Nueva propuesta enviada" });
      onCambio();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo enviar", description: error.message }),
  });

  const retirarMutation = useMutation({
    mutationFn: () => retirarPostulacion(miPostulacion!.id),
    onSuccess: () => {
      sileo.success({ title: "Postulación retirada" });
      onCambio();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo retirar", description: error.message }),
  });

  if (cargando) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-background p-6 shadow-sm text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!anuncioActivo && !miPostulacion) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Tu postulación</h2>

      {!miPostulacion ? (
        anuncioActivo && (
          miTarifaHora == null ? (
            <p className="mt-3 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Antes de postularte, fija tu tarifa por hora en{" "}
              <Link href="/perfil" className="font-medium text-foreground underline underline-offset-2">
                tu perfil
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-sm text-foreground">
                Te postularás con tu tarifa: <strong>{miTarifaHora} €/hora</strong>
              </p>
              <Button
                type="button"
                size="sm"
                className="ml-auto"
                disabled={postularseMutation.isPending}
                onClick={() => postularseMutation.mutate()}
              >
                Postularme
              </Button>
            </div>
          )
        )
      ) : (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-foreground">
              Precio propuesto: <strong>{miPostulacion.precioHora} €/hora</strong>{" "}
              ({miPostulacion.propuestoPor === "cuidador" ? "enviado por ti" : "enviado por el paciente/familiar"})
            </p>
            <EstadoPostulacionBadge estado={miPostulacion.estado} />
          </div>

          {miPostulacion.estado === "pendiente" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min="0.01"
                step="0.5"
                defaultValue={miPostulacion.precioHora}
                onChange={(e) => setPrecio(e.target.value)}
                className="h-8 w-28 text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={contraofertaMutation.isPending || !precio}
                onClick={() => contraofertaMutation.mutate(Number(precio))}
              >
                Enviar nueva propuesta
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={retirarMutation.isPending}
                onClick={() => retirarMutation.mutate()}
              >
                Retirar postulación
              </Button>
            </div>
          )}

          {miPostulacion.estado === "aceptada" && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              ¡Tu postulación fue aceptada! Consulta tus servicios para más detalles.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EstadoPostulacionBadge({ estado }: { estado: Postulacion["estado"] }) {
  const label: Record<Postulacion["estado"], string> = {
    pendiente: "Pendiente",
    aceptada: "Aceptada",
    rechazada: "Rechazada",
    retirada: "Retirada",
  };
  const color: Record<Postulacion["estado"], string> = {
    pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    aceptada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rechazada: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    retirada: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${color[estado]}`}>
      {label[estado]}
    </span>
  );
}
