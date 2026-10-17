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
  confirmarServicio,
  confirmarTramo,
  listarTramos,
  type EstadoTramo,
  type Tramo,
} from "@/lib/api/servicios";
import { formatearFecha } from "@/lib/fecha";
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

  const tramosQuery = useQuery({
    queryKey: ["servicio", servicioId, "tramos"],
    queryFn: () => listarTramos(servicioId),
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

  if (tramos.length === 0) {
    if (rol === "cuidador") {
      return null;
    }
    return (
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-sm text-foreground">
          Cuando el cuidado haya terminado, confírmalo para que el pago se entregue al cuidador.
        </p>
        <div>
          <Button type="button" size="sm" onClick={() => setConfirmando(true)}>
            Confirmar que el cuidado se ha realizado
          </Button>
        </div>

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
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{formatearFecha(tramo.fecha)}</p>
        <p className="text-xs text-muted-foreground">
          {tramo.horas} h · {formatearEuros(tramo.importe)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_TRAMO_COLOR[tramo.estado]}`}>
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
