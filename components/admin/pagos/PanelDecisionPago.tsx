"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolverPago, type PagoDetalle } from "@/lib/api/adminPagos";
import { NOTAS_RAPIDAS } from "@/lib/pago/estados";
import { formatearEuros } from "@/lib/pago/formato";
import { calcularReparto, redondear, reembolsoPorHoras } from "@/lib/pago/reparto";
import { cn } from "@/lib/utils";

type Opcion = "cuidador" | "familia" | "reparto";

const OPCIONES: { valor: Opcion; titulo: string; descripcion: string }[] = [
  { valor: "cuidador", titulo: "Pagar todo al cuidador", descripcion: "El cuidado se hizo correctamente." },
  { valor: "familia", titulo: "Devolver todo a la familia", descripcion: "El cuidado no se hizo." },
  { valor: "reparto", titulo: "Repartir", descripcion: "Una parte para cada uno." },
];

/**
 * Decidir como se reparte el dinero retenido de un servicio, en tres pasos:
 * que hacer, por que, y confirmar. Muestra siempre cuanto recibiria cada parte
 * antes de aplicar nada.
 */
export default function PanelDecisionPago({ pago }: { pago: PagoDetalle }) {
  const queryClient = useQueryClient();
  const [opcion, setOpcion] = useState<Opcion | null>(null);
  const [reembolsoTexto, setReembolsoTexto] = useState("");
  const [horasTexto, setHorasTexto] = useState("");
  const [nota, setNota] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const retenido = pago.importeRetenido;
  const reembolsoIntroducido = Number(reembolsoTexto.replace(",", "."));
  const reembolso =
    opcion === "cuidador"
      ? 0
      : opcion === "familia"
        ? retenido
        : opcion === "reparto" && Number.isFinite(reembolsoIntroducido)
          ? Math.min(Math.max(reembolsoIntroducido, 0), retenido)
          : 0;
  const reparto = calcularReparto(retenido, reembolso, pago.comisionPorcentaje);

  const bloqueado = reparto.cuidador > 0 && !pago.cuidadorPuedeRecibir;
  const notaValida = nota.trim().length >= 5;
  const puedeAplicar = opcion !== null && notaValida && !bloqueado && retenido > 0;
  const porHoras = pago.tramos.length === 0;

  const resolverMutation = useMutation({
    mutationFn: () => resolverPago(pago.servicioId, { importeReembolso: reparto.familia, nota: nota.trim() }),
    onSuccess: (detalle) => {
      sileo.success({
        title: "Reparto aplicado",
        description:
          reparto.familia > 0 && reparto.cuidador > 0
            ? `${formatearEuros(reparto.familia)} para la familia y ${formatearEuros(reparto.cuidador)} para el cuidador.`
            : reparto.familia > 0
              ? `${formatearEuros(reparto.familia)} devueltos a la familia.`
              : `${formatearEuros(reparto.cuidador)} entregados al cuidador.`,
      });
      setConfirmando(false);
      queryClient.setQueryData(["admin", "pagos", "detalle", pago.servicioId], detalle);
      queryClient.invalidateQueries({ queryKey: ["admin", "pagos"] });
    },
    onError: (error: Error) => {
      setConfirmando(false);
      sileo.error({ title: "No se pudo aplicar el reparto", description: error.message });
    },
  });

  function fijarReembolso(valor: number) {
    setReembolsoTexto(String(redondear(Math.min(Math.max(valor, 0), retenido))));
  }

  function calcularPorHoras() {
    const horas = Number(horasTexto.replace(",", "."));
    if (Number.isFinite(horas) && horas >= 0) {
      fijarReembolso(reembolsoPorHoras(retenido, Math.min(horas, pago.horasTotales), pago.precioHoraAcordado));
    }
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-float ring-2 ring-primary/20">
      <h2 className="text-lg font-semibold text-foreground">Decide cómo repartir el dinero</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Hay <strong className="text-foreground">{formatearEuros(retenido)}</strong> retenidos. Elige qué hacer con ellos.
      </p>

      <h3 className="mt-6 text-sm font-semibold text-foreground">1. ¿Qué quieres hacer?</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {OPCIONES.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={opcion === o.valor}
            onClick={() => setOpcion(o.valor)}
            className={cn(
              "rounded-xl p-4 text-left transition-all",
              opcion === o.valor
                ? "bg-primary text-primary-foreground shadow-primary"
                : "bg-muted/50 text-foreground hover:bg-muted",
            )}
          >
            <p className="text-sm font-semibold">{o.titulo}</p>
            <p className={cn("mt-0.5 text-xs", opcion === o.valor ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {o.descripcion}
            </p>
          </button>
        ))}
      </div>

      {opcion === "reparto" && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl bg-muted/40 p-4">
          <div className="grid gap-1.5">
            <label htmlFor="reembolso" className="text-sm font-medium text-foreground">
              ¿Cuánto se devuelve a la familia?
            </label>
            <div className="flex items-center gap-2">
              <div className="relative w-40">
                <Input
                  id="reembolso"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={retenido}
                  step="0.01"
                  value={reembolsoTexto}
                  onChange={(e) => setReembolsoTexto(e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
              {[25, 50, 75].map((p) => (
                <Button key={p} type="button" size="sm" variant="outline" onClick={() => fijarReembolso((retenido * p) / 100)}>
                  {p} %
                </Button>
              ))}
            </div>
            <input
              type="range"
              aria-label="Importe que se devuelve a la familia"
              min={0}
              max={retenido}
              step={0.01}
              value={reembolso}
              onChange={(e) => fijarReembolso(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </div>

          {porHoras && (
            <div className="grid gap-1.5">
              <label htmlFor="horas" className="text-sm font-medium text-foreground">
                O calcúlalo por horas: ¿cuántas horas trabajó el cuidador? (de {pago.horasTotales} h)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="horas"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={pago.horasTotales}
                  step="0.5"
                  value={horasTexto}
                  onChange={(e) => setHorasTexto(e.target.value)}
                  className="w-28"
                />
                <Button type="button" size="sm" variant="outline" onClick={calcularPorHoras} disabled={horasTexto === ""}>
                  Calcular
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Al cuidador se le paga {formatearEuros(pago.precioHoraAcordado)} por hora trabajada y el resto vuelve a la
                familia.
              </p>
            </div>
          )}
        </div>
      )}

      {opcion !== null && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-live="polite">
            <Resultado etiqueta="La familia recibe" valor={reparto.familia} color="text-sky-700 dark:text-sky-300" />
            <Resultado
              etiqueta={`El cuidador recibe (tras ${pago.comisionPorcentaje} % de comisión)`}
              valor={reparto.cuidador}
              color="text-emerald-700 dark:text-emerald-300"
            />
            <Resultado etiqueta="Comisión de la plataforma" valor={reparto.comision} color="text-foreground" />
          </div>
          {pago.tramos.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Importes orientativos: al repartirse día a día, el cálculo final puede variar en algún céntimo.
            </p>
          )}
          {reparto.familia > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ten en cuenta que Stripe no devuelve a la plataforma su comisión de procesamiento de la tarjeta cuando se
              reembolsa.
            </p>
          )}
          {bloqueado && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                El cuidador todavía no ha completado sus datos de cobro, así que no se le puede entregar dinero ahora.
                Puedes devolver todo a la familia, o esperar a que el cuidador los complete y avisarle.
              </span>
            </p>
          )}
        </>
      )}

      <h3 className="mt-6 text-sm font-semibold text-foreground">2. ¿Por qué lo decides así?</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Obligatorio. Queda guardado como constancia de la decisión.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {NOTAS_RAPIDAS.map((frase) => (
          <button
            key={frase}
            type="button"
            onClick={() => setNota(frase)}
            className="rounded-full bg-muted px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted/70"
          >
            {frase}
          </button>
        ))}
      </div>
      <Textarea
        aria-label="Motivo de la decisión"
        value={nota}
        maxLength={500}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Escribe el motivo, o elige una de las frases de arriba"
        className="mt-3"
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {opcion === null
            ? "Elige una opción para continuar."
            : !notaValida
              ? "Falta escribir el motivo."
              : bloqueado
                ? "No se puede aplicar mientras el cuidador no pueda cobrar."
                : "Revisa los importes antes de aplicar."}
        </p>
        <Button type="button" disabled={!puedeAplicar} onClick={() => setConfirmando(true)}>
          Aplicar reparto
        </Button>
      </div>

      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Aplicar este reparto?</DialogTitle>
            <DialogDescription>
              El dinero se mueve en Stripe al momento y no se puede deshacer desde la aplicación.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-1.5 text-sm text-foreground">
            <li>
              La familia recibe: <strong>{formatearEuros(reparto.familia)}</strong>
            </li>
            <li>
              El cuidador recibe: <strong>{formatearEuros(reparto.cuidador)}</strong>
            </li>
            <li>
              Comisión de la plataforma: <strong>{formatearEuros(reparto.comision)}</strong>
            </li>
            <li className="text-muted-foreground">Motivo: “{nota.trim()}”</li>
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmando(false)}>
              Volver
            </Button>
            <Button type="button" disabled={resolverMutation.isPending} onClick={() => resolverMutation.mutate()}>
              {resolverMutation.isPending ? "Aplicando…" : "Sí, aplicar reparto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Resultado({ etiqueta, valor, color }: { etiqueta: string; valor: number; color: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className={cn("text-xl font-semibold", color)}>{formatearEuros(valor)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{etiqueta}</p>
    </div>
  );
}
