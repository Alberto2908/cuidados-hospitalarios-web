"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  abrirIncidenciaServicio,
  confirmarServicio,
  confirmarTramo,
  listarTramos,
  obtenerServicio,
  responderIncidenciaServicio,
  type EstadoTramo,
  type MotivoIncidencia,
  type Tramo,
} from "@/lib/api/servicios";
import { Textarea } from "@/components/ui/textarea";
import { formatearFecha, formatearFechaHora } from "@/lib/fecha";
import { textoPlazoRespuesta } from "@/lib/incidencia/plazo";
import { useAhora } from "@/lib/ui/useAhora";
import { formatearEuros } from "@/lib/pago/formato";

const ESTADO_TRAMO_LABEL: Record<EstadoTramo, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  liberado: "Entregado al cuidador",
  reembolsado: "Devuelto",
};

const ESTADO_TRAMO_COLOR: Record<EstadoTramo, string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmado: "bg-accent text-accent-foreground",
  liberado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  reembolsado: "bg-muted text-muted-foreground",
};

function haTerminado(finIso: string): boolean {
  return new Date(finIso).getTime() <= Date.now();
}

interface ConfirmacionCuidadoProps {
  servicioId: string;
  /**
   * "paciente": confirma el cuidado (o cada dia) y libera el pago al cuidador.
   * "cuidador": solo ve el avance de los dias.
   */
  rol: "paciente" | "cuidador";
  /** Se llama tras confirmar algo, para que el padre refresque sus datos. */
  onCambio?: () => void;
}

/**
 * Confirmacion del cuidado. Un cuidado corto se confirma de una vez; uno largo
 * (mas dias que el umbral del backend) se confirma dia a dia, y a medida que se
 * confirma cada dia le entra al cuidador la parte de ese dia.
 */
export default function ConfirmacionCuidado({ servicioId, rol, onCambio }: ConfirmacionCuidadoProps) {
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);
  const [incidenciaAbierta, setIncidenciaAbierta] = useState(false);
  const [respuestaAbierta, setRespuestaAbierta] = useState(false);
  // Reloj para que el tiempo que queda al cuidador se actualice solo (se muestra en horas).
  const ahora = useAhora(60_000);

  const tramosQuery = useQuery({
    queryKey: ["servicio", servicioId, "tramos"],
    queryFn: () => listarTramos(servicioId),
  });

  // Misma consulta que ResumenPago (se comparte la cache).
  const servicioQuery = useQuery({
    queryKey: ["servicio", servicioId],
    queryFn: () => obtenerServicio(servicioId),
  });

  function refrescar() {
    queryClient.invalidateQueries({ queryKey: ["servicio", servicioId] });
    onCambio?.();
  }

  const confirmarTodoMutation = useMutation({
    mutationFn: () => confirmarServicio(servicioId),
    onSuccess: () => {
      sileo.success({
        title: "Cuidado confirmado",
        description: "El pago se ha entregado al cuidador.",
      });
      setConfirmando(false);
      refrescar();
    },
    onError: (error: Error) => {
      setConfirmando(false);
      sileo.error({ title: "No se pudo confirmar", description: error.message });
    },
  });

  const incidenciaMutation = useMutation({
    mutationFn: (datos: { motivo: MotivoIncidencia; descripcion: string }) => abrirIncidenciaServicio(servicioId, datos),
    onSuccess: () => {
      sileo.success({
        title: "Incidencia enviada",
        description: "La plataforma la revisará. Mientras tanto el dinero sigue retenido.",
      });
      setIncidenciaAbierta(false);
      refrescar();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo abrir la incidencia", description: error.message }),
  });

  const respuestaMutation = useMutation({
    mutationFn: (descripcion: string) => responderIncidenciaServicio(servicioId, descripcion),
    onSuccess: () => {
      sileo.success({ title: "Versión enviada", description: "La plataforma la tendrá en cuenta al revisar la incidencia." });
      setRespuestaAbierta(false);
      refrescar();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo enviar", description: error.message }),
  });

  const confirmarDiaMutation = useMutation({
    mutationFn: (tramoId: string) => confirmarTramo(tramoId),
    onSuccess: () => {
      sileo.success({ title: "Día confirmado", description: "Se ha entregado al cuidador la parte de ese día." });
      refrescar();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo confirmar el día", description: error.message }),
  });

  const tramos = tramosQuery.data;
  if (!tramos) {
    return null;
  }

  // Con una incidencia abierta no se confirma nada: la revisa la plataforma.
  const servicio = servicioQuery.data;
  const incidencia = servicio?.incidenciaAbiertaEn && servicio.estadoPago === "procesado" ? servicio : null;
  if (incidencia && rol === "paciente") {
    return (
      <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        Has abierto una incidencia sobre este cuidado ({formatearFecha(incidencia.incidenciaAbiertaEn as string)}). La
        plataforma la revisará y decidirá el reparto del pago; mientras tanto el dinero sigue retenido y no se puede
        confirmar.
        {incidencia.incidenciaRespuestaCuidador ? " El cuidador ya ha aportado su versión." : ""}
        {!incidencia.incidenciaRespuestaCuidador && incidencia.incidenciaRespuestaLimite
          ? ` ${textoPlazoRespuesta(incidencia.incidenciaRespuestaLimite, ahora, "tercero")}`
          : ""}
      </p>
    );
  }
  if (incidencia && rol === "cuidador") {
    return (
      <div className="mt-3 flex flex-col gap-2">
        {/* Recuadro con ancho limitado; el boton va a su derecha, a la altura donde acaba (norma de botones). */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 max-w-3xl flex-col gap-2 break-words rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-semibold">Este cuidado tiene una incidencia abierta</p>
            <p>{TEXTO_MOTIVO_CUIDADOR[incidencia.incidenciaMotivo ?? "otro"]}</p>
            <p>«{incidencia.incidenciaDescripcion}».</p>
            <p>La plataforma la está revisando y decidirá el reparto del pago.</p>
            {!incidencia.incidenciaRespuestaCuidador && incidencia.incidenciaRespuestaLimite && (
              <p className="font-medium">{textoPlazoRespuesta(incidencia.incidenciaRespuestaLimite, ahora, "cuidador")}</p>
            )}
            {incidencia.incidenciaRespuestaCuidador && (
              <p>
                <span className="font-medium">Tu versión:</span> «{incidencia.incidenciaRespuestaCuidador}»
              </p>
            )}
          </div>
          {!incidencia.incidenciaRespuestaCuidador && (
            <Button type="button" size="sm" className={`shrink-0 ${BOTON_NEGRO}`} onClick={() => setRespuestaAbierta(true)}>
              Aportar mi versión
            </Button>
          )}
        </div>
        <ModalRespuestaIncidencia
          open={respuestaAbierta}
          onOpenChange={setRespuestaAbierta}
          motivo={incidencia.incidenciaMotivo}
          descripcionFamilia={incidencia.incidenciaDescripcion}
          enviando={respuestaMutation.isPending}
          onEnviar={(descripcion) => respuestaMutation.mutate(descripcion)}
        />
      </div>
    );
  }

  const modalIncidencia = (
    <ModalIncidencia
      open={incidenciaAbierta}
      onOpenChange={setIncidenciaAbierta}
      enviando={incidenciaMutation.isPending}
      onEnviar={(datos) => incidenciaMutation.mutate(datos)}
    />
  );

  if (tramos.length === 0) {
    if (rol === "cuidador") {
      return null;
    }
    const fin = servicioQuery.data?.fechaFinPrevista;
    if (!fin) {
      return null;
    }
    // Hasta que termina el cuidado no se puede confirmar (el backend tambien lo exige).
    if (!haTerminado(fin)) {
      return (
        <p className="mt-3 text-sm text-muted-foreground">
          Podrás confirmar el cuidado cuando termine ({formatearFechaHora(fin)}). El dinero sigue retenido hasta entonces.
        </p>
      );
    }
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            El cuidado ha terminado. Confírmalo para que el pago se entregue al cuidador.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" className={BOTON_NEGRO} onClick={() => setIncidenciaAbierta(true)}>
              Abrir incidencia
            </Button>
            <Button type="button" size="sm" onClick={() => setConfirmando(true)}>
              Confirmar que el cuidado se ha realizado
            </Button>
          </div>
        </div>
        {modalIncidencia}

        <Dialog open={confirmando} onOpenChange={setConfirmando}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar el cuidado</DialogTitle>
              <DialogDescription>
                Al confirmar, el pago se entrega al cuidador y ya no se puede recuperar desde la aplicación. Si ha
                habido algún problema con el cuidado, no lo confirmes y contacta con nosotros.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmando(false)}>
                Volver
              </Button>
              <Button
                type="button"
                disabled={confirmarTodoMutation.isPending}
                onClick={() => confirmarTodoMutation.mutate()}
              >
                {confirmarTodoMutation.isPending ? "Un momento…" : "Confirmar cuidado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const confirmables = tramos.filter((t) => t.confirmable);
  const pendientes = tramos.filter((t) => t.estado === "pendiente").length;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-sm text-foreground">
        {rol === "paciente"
          ? "Este cuidado se confirma día a día: al confirmar cada día terminado, se entrega al cuidador la parte de ese día."
          : "Este cuidado se paga día a día: recibirás la parte de cada día según el paciente/familiar lo vaya confirmando."}
      </p>

      <ul className="flex flex-col gap-1.5">
        {tramos.map((tramo) => (
          <FilaTramo
            key={tramo.id}
            tramo={tramo}
            rol={rol}
            enviando={confirmarDiaMutation.isPending && confirmarDiaMutation.variables === tramo.id}
            onConfirmar={() => confirmarDiaMutation.mutate(tramo.id)}
          />
        ))}
      </ul>

      {rol === "paciente" && confirmables.length > 1 && (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={confirmarTodoMutation.isPending}
            onClick={() => confirmarTodoMutation.mutate()}
          >
            {confirmarTodoMutation.isPending ? "Un momento…" : `Confirmar los ${confirmables.length} días terminados`}
          </Button>
        </div>
      )}
      {rol === "paciente" && pendientes === 0 && (
        <p className="text-xs text-muted-foreground">Todos los días están confirmados.</p>
      )}
      {rol === "paciente" && pendientes > 0 && (
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" className={BOTON_NEGRO} onClick={() => setIncidenciaAbierta(true)}>
            Abrir incidencia
          </Button>
        </div>
      )}
      {rol === "paciente" && modalIncidencia}
    </div>
  );
}

function FilaTramo({
  tramo,
  rol,
  enviando,
  onConfirmar,
}: {
  tramo: Tramo;
  rol: "paciente" | "cuidador";
  enviando: boolean;
  onConfirmar: () => void;
}) {
  const sinTerminar = tramo.estado === "pendiente" && !tramo.confirmable;
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-sunken px-3 py-2 shadow-inset-soft text-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{formatearFecha(tramo.fecha)}</p>
        <p className="text-xs text-muted-foreground">
          {tramo.horas} h · {formatearEuros(tramo.importe)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_TRAMO_COLOR[tramo.estado]}`}>
          {ESTADO_TRAMO_LABEL[tramo.estado]}
        </span>
        {tramo.confirmable && rol === "paciente" && (
          <Button type="button" size="sm" disabled={enviando} onClick={onConfirmar}>
            {enviando ? "Un momento…" : "Confirmar día"}
          </Button>
        )}
        {sinTerminar && <span className="text-xs text-muted-foreground">Aún no ha terminado</span>}
      </div>
    </li>
  );
}

// Mismo negro que el boton "Ver perfil" (BotonVerPerfil): la variante outline fuerza el hover claro, por eso se pisa tambien.
export const BOTON_NEGRO =
  "border-0 bg-foreground text-background hover:bg-foreground/90 hover:text-background hover:shadow-none";

const MOTIVOS_INCIDENCIA: { valor: MotivoIncidencia; etiqueta: string }[] = [
  { valor: "no_se_presento", etiqueta: "El cuidador no se presentó" },
  { valor: "se_fue_antes", etiqueta: "El cuidador se marchó antes de terminar" },
  { valor: "otro", etiqueta: "Otro problema" },
];

const MIN_DESCRIPCION = 10;

// Como se le cuenta al cuidador lo que ha comunicado la familia, segun el motivo elegido.
const TEXTO_MOTIVO_CUIDADOR: Record<MotivoIncidencia, string> = {
  no_se_presento: "La familia ha comunicado que el cuidador no se presentó.",
  se_fue_antes: "La familia ha comunicado que el cuidador se marchó antes de terminar.",
  otro: "La familia ha comunicado un problema:",
};

/** Aviso de un problema con el cuidado: motivo + explicacion obligatoria. La revisa la plataforma. */
export function ModalIncidencia({
  open,
  onOpenChange,
  enviando,
  onEnviar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enviando: boolean;
  onEnviar: (datos: { motivo: MotivoIncidencia; descripcion: string }) => void;
}) {
  const [motivo, setMotivo] = useState<MotivoIncidencia>("no_se_presento");
  const [descripcion, setDescripcion] = useState("");
  const valida = descripcion.trim().length >= MIN_DESCRIPCION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir una incidencia</DialogTitle>
          <DialogDescription>
            Cuéntanos qué ha pasado. La plataforma lo revisará y decidirá cuánto se devuelve y cuánto se entrega al
            cuidador. Mientras tanto, el pago sigue retenido.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Motivo</legend>
          {MOTIVOS_INCIDENCIA.map((m) => (
            <label key={m.valor} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="motivo-incidencia"
                checked={motivo === m.valor}
                onChange={() => setMotivo(m.valor)}
                className="accent-primary"
              />
              {m.etiqueta}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={1000}
            placeholder="Describe lo ocurrido (a qué hora, qué pasó…)"
            aria-label="Descripción de la incidencia"
          />
          {!valida && descripcion.length > 0 && (
            <p className="text-xs text-muted-foreground">Escribe al menos {MIN_DESCRIPCION} caracteres.</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button type="button" disabled={!valida || enviando} onClick={() => onEnviar({ motivo, descripcion: descripcion.trim() })}>
            {enviando ? "Enviando…" : "Enviar incidencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** El cuidador aporta su version de una incidencia abierta por la familia (una sola vez). */
export function ModalRespuestaIncidencia({
  open,
  onOpenChange,
  motivo,
  descripcionFamilia,
  enviando,
  onEnviar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lo que comunico la familia, para tenerlo delante al contestar. */
  motivo: MotivoIncidencia | null;
  descripcionFamilia: string | null;
  enviando: boolean;
  onEnviar: (descripcion: string) => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const valida = descripcion.trim().length >= MIN_DESCRIPCION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aportar tu versión</DialogTitle>
          <DialogDescription>
            Cuéntanos qué ocurrió desde tu punto de vista. La plataforma leerá tu versión y la de la familia antes de
            decidir el reparto del pago. Solo puedes enviarla una vez.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="text-xs font-semibold uppercase tracking-wide">Motivo de la incidencia</p>
          <p>{TEXTO_MOTIVO_CUIDADOR[motivo ?? "otro"]}</p>
          {descripcionFamilia && <p className="break-words">«{descripcionFamilia}».</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={1000}
            placeholder="Describe lo ocurrido (a qué hora llegaste, qué pasó…)"
            aria-label="Tu versión de lo ocurrido"
          />
          {!valida && descripcion.length > 0 && (
            <p className="text-xs text-muted-foreground">Escribe al menos {MIN_DESCRIPCION} caracteres.</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button type="button" disabled={!valida || enviando} onClick={() => onEnviar(descripcion.trim())}>
            {enviando ? "Enviando…" : "Enviar mi versión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
