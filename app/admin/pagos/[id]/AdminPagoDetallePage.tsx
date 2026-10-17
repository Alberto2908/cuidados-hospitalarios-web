"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CircleCheck, Mail, Phone } from "lucide-react";
import PanelDecisionPago from "@/components/admin/pagos/PanelDecisionPago";
import { fetchPagoDetalle, type PagoDetalle } from "@/lib/api/adminPagos";
import type { EstadoTramo } from "@/lib/api/servicios";
import { formatearFecha, formatearFechaHora } from "@/lib/fecha";
import { formatearEuros } from "@/lib/pago/formato";
import {
  ESTADO_PAGO_ADMIN_COLOR,
  ESTADO_PAGO_ADMIN_LABEL,
  ESTADO_SERVICIO_ADMIN_LABEL,
  MOTIVO_TITULO,
} from "@/lib/pago/estados";

const ESTADO_TRAMO_LABEL: Record<EstadoTramo, string> = {
  pendiente: "Sin confirmar",
  confirmado: "Confirmado, pendiente de entregar",
  liberado: "Entregado al cuidador",
  reembolsado: "Devuelto",
};

export default function AdminPagoDetallePage() {
  const params = useParams<{ id: string }>();
  const { data: pago, isLoading, isError } = useQuery({
    queryKey: ["admin", "pagos", "detalle", params.id],
    queryFn: () => fetchPagoDetalle(params.id),
  });

  return (
    <div className="page-container py-10">
      <Link
        href="/admin/pagos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pagos
      </Link>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : isError || !pago ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No se ha podido cargar este pago.</p>
      ) : (
        <Contenido pago={pago} />
      )}
    </div>
  );
}

function Contenido({ pago }: { pago: PagoDetalle }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{pago.anuncioTitulo}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_PAGO_ADMIN_COLOR[pago.estadoPago]}`}>
            {ESTADO_PAGO_ADMIN_LABEL[pago.estadoPago]}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {ESTADO_SERVICIO_ADMIN_LABEL[pago.estado]}
          </span>
          <Link href={`/admin/anuncios/${pago.anuncioId}`} className="text-xs text-primary underline-offset-2 hover:underline">
            Ver el anuncio
          </Link>
        </div>
      </div>

      {pago.motivos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pago.motivos.map((m) => (
            <li
              key={m.codigo}
              className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {MOTIVO_TITULO[m.codigo] ?? m.codigo}
              </p>
              <p className="mt-1">{m.texto}</p>
            </li>
          ))}
        </ul>
      )}

      {pago.incidencia && (
        <Tarjeta titulo="Incidencia">
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground">
                Versión de la familia · {MOTIVO_INCIDENCIA_LABEL[pago.incidencia.motivo]} ·{" "}
                <span className="font-normal text-muted-foreground">{formatearFechaHora(pago.incidencia.abiertaEn)}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{pago.incidencia.descripcion}</p>
            </div>
            <div>
              {pago.incidencia.respuestaCuidador ? (
                <>
                  <p className="font-medium text-foreground">
                    Versión del cuidador ·{" "}
                    <span className="font-normal text-muted-foreground">
                      {pago.incidencia.respuestaEn ? formatearFechaHora(pago.incidencia.respuestaEn) : ""}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground">{pago.incidencia.respuestaCuidador}</p>
                </>
              ) : (
                <p className="text-muted-foreground">El cuidador todavía no ha aportado su versión.</p>
              )}
            </div>
          </div>
        </Tarjeta>
      )}

      {pago.estado === "cancelado" && (
        <Tarjeta titulo="Cancelación">
          <p className="text-sm text-foreground">
            Cancelado por{" "}
            <strong>
              {pago.canceladoPor === "paciente"
                ? "la familia"
                : pago.canceladoPor === "cuidador"
                  ? "el cuidador"
                  : "la plataforma"}
            </strong>
            {pago.canceladoEn && <> el {formatearFechaHora(pago.canceladoEn)}</>}
            {pago.cancelacionTardia && <>, con poca antelación</>}.
          </p>
          {pago.motivoCancelacion && (
            <p className="mt-1 text-sm text-muted-foreground">Motivo indicado: “{pago.motivoCancelacion}”</p>
          )}
        </Tarjeta>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Tarjeta titulo="El dinero">
          <dl className="flex flex-col gap-2 text-sm">
            <Fila etiqueta="Importe del servicio" valor={formatearEuros(pago.importeTotal)} />
            <Fila
              etiqueta="Duración y precio"
              valor={`${pago.horasTotales} h × ${formatearEuros(pago.precioHoraAcordado)}/h`}
            />
            <Fila etiqueta="Pagado el" valor={pago.pagadoEn ? formatearFechaHora(pago.pagadoEn) : "—"} />
            <hr className="border-border" />
            <Fila etiqueta="Retenido ahora en la plataforma" valor={formatearEuros(pago.importeRetenido)} destacado />
            <Fila etiqueta="Entregado al cuidador" valor={formatearEuros(pago.importeCuidador ?? 0)} />
            <Fila etiqueta="Comisión de la plataforma" valor={formatearEuros(pago.importeComision ?? 0)} />
            <Fila etiqueta="Devuelto a la familia" valor={formatearEuros(pago.importeReembolsado)} />
          </dl>
        </Tarjeta>

        <Tarjeta titulo="Las personas">
          <Persona
            rol="Familia / paciente"
            nombre={pago.pacienteNombre}
            email={pago.pacienteEmail}
            telefono={pago.pacienteTelefono}
          />
          <hr className="my-3 border-border" />
          <Persona
            rol="Cuidador"
            nombre={pago.cuidadorNombre}
            email={pago.cuidadorEmail}
            telefono={pago.cuidadorTelefono}
          />
          <p
            className={`mt-2 flex items-center gap-1.5 text-xs ${
              pago.cuidadorPuedeRecibir ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-300"
            }`}
          >
            {pago.cuidadorPuedeRecibir ? (
              <>
                <CircleCheck className="h-3.5 w-3.5" /> Puede recibir pagos
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5" /> Todavía no ha completado sus datos de cobro
              </>
            )}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            El cuidado termina el {formatearFecha(pago.fechaFinPrevista)}.
          </p>
        </Tarjeta>
      </div>

      {pago.tramos.length > 0 && (
        <Tarjeta titulo="Día a día">
          <p className="mb-3 text-sm text-muted-foreground">
            Este cuidado se confirma y se paga por días. Solo se puede repartir lo que aún no se ha entregado.
          </p>
          <ul className="flex flex-col gap-1.5">
            {pago.tramos.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">
                  {formatearFecha(t.fecha)} <span className="font-normal text-muted-foreground">· {t.horas} h</span>
                </span>
                <span className="text-muted-foreground">
                  {formatearEuros(t.importe)} · {ESTADO_TRAMO_LABEL[t.estado]}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {pago.puedeResolver ? (
        <PanelDecisionPago pago={pago} />
      ) : (
        <Tarjeta titulo="Estado del reparto">
          <p className="text-sm text-foreground">
            {pago.estadoPago === "pendiente" || pago.estadoPago === "fallido"
              ? "Este servicio todavía no se ha pagado: no hay dinero que repartir."
              : "El dinero de este servicio ya se ha repartido: no queda nada retenido."}
          </p>
        </Tarjeta>
      )}

      {pago.resolucionEn && (
        <Tarjeta titulo="Decisión tomada">
          <p className="text-sm text-foreground">
            {pago.resolucionPor ?? "Un administrador"} resolvió este pago el {formatearFechaHora(pago.resolucionEn)}.
          </p>
          {pago.resolucionNota && (
            <p className="mt-1 text-sm text-muted-foreground">Motivo: “{pago.resolucionNota}”</p>
          )}
        </Tarjeta>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Referencias técnicas (Stripe)</summary>
        <div className="mt-2 flex flex-col gap-1 font-mono">
          <span>Pago: {pago.stripePaymentIntentId ?? "—"}</span>
          <span>Cargo: {pago.stripeChargeId ?? "—"}</span>
          <span>Servicio: {pago.servicioId}</span>
        </div>
      </details>
    </div>
  );
}

const MOTIVO_INCIDENCIA_LABEL: Record<"no_se_presento" | "se_fue_antes" | "otro", string> = {
  no_se_presento: "El cuidador no se presentó",
  se_fue_antes: "El cuidador se marchó antes de terminar",
  otro: "Otro problema",
};

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-6 shadow-float">
      <h2 className="mb-3 text-base font-semibold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function Fila({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={destacado ? "font-medium text-foreground" : "text-muted-foreground"}>{etiqueta}</dt>
      <dd className={destacado ? "text-base font-semibold text-foreground" : "text-foreground"}>{valor}</dd>
    </div>
  );
}

function Persona({
  rol,
  nombre,
  email,
  telefono,
}: {
  rol: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
}) {
  return (
    <div className="text-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rol}</p>
      <p className="font-medium text-foreground">{nombre}</p>
      {email && (
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          {email}
        </p>
      )}
      {telefono && (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          {telefono}
        </p>
      )}
    </div>
  );
}
