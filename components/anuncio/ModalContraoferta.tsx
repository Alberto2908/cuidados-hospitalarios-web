"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function redondear(valor: number) {
  return Math.round(valor * 100) / 100;
}

interface ModalContraofertaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Horas totales del anuncio: convierte entre precio/hora y precio total. */
  horas: number;
  precioHoraInicial: number;
  onEnviar: (precioHora: number) => void;
  enviando: boolean;
}

/**
 * No todo el mundo piensa en €/hora al negociar: unos prefieren fijar el
 * total que van a pagar/cobrar. Los dos campos son la misma cifra en dos
 * unidades, no dos valores independientes — cambiar uno recalcula el otro.
 *
 * El estado inicial solo se lee de las props al montar (sin useEffect): el
 * padre debe pasar una `key` que cambie cada vez que se abre el modal (ver
 * los usos en AnuncioDetallePage) para que remonte con los valores actuales
 * en vez de arrastrar un borrador de una apertura anterior.
 */
export default function ModalContraoferta({
  open,
  onOpenChange,
  horas,
  precioHoraInicial,
  onEnviar,
  enviando,
}: ModalContraofertaProps) {
  const [precioHora, setPrecioHora] = useState(String(precioHoraInicial));
  const [precioTotal, setPrecioTotal] = useState(String(redondear(precioHoraInicial * horas)));

  function actualizarDesdeHora(valor: string) {
    setPrecioHora(valor);
    const n = Number(valor);
    if (!Number.isNaN(n) && n >= 0) {
      setPrecioTotal(String(redondear(n * horas)));
    }
  }

  function actualizarDesdeTotal(valor: string) {
    setPrecioTotal(valor);
    const n = Number(valor);
    if (!Number.isNaN(n) && n >= 0 && horas > 0) {
      setPrecioHora(String(redondear(n / horas)));
    }
  }

  const precioHoraNumero = Number(precioHora);
  const esValido = precioHoraNumero > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proponer un precio</DialogTitle>
          <DialogDescription>
            Este servicio son {horas} {horas === 1 ? "hora" : "horas"} en total. Cambia el precio por hora o el precio
            total: el otro campo se recalcula solo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="modal-precio-hora" className="text-sm font-medium text-foreground">
              Precio por hora
            </label>
            <div className="relative">
              <Input
                id="modal-precio-hora"
                type="number"
                min="0.01"
                step="0.5"
                value={precioHora}
                onChange={(e) => actualizarDesdeHora(e.target.value)}
                className="pr-16"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €/hora
              </span>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="modal-precio-total" className="text-sm font-medium text-foreground">
              Precio total del servicio
            </label>
            <div className="relative">
              <Input
                id="modal-precio-total"
                type="number"
                min="0.01"
                step="0.5"
                value={precioTotal}
                onChange={(e) => actualizarDesdeTotal(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!esValido || enviando} onClick={() => onEnviar(precioHoraNumero)}>
            {enviando ? "Enviando…" : "Enviar propuesta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
