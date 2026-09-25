"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  confirmando?: boolean;
  onConfirmar: () => void;
}

// Reemplaza al confirm() nativo del navegador (bloqueante, sin estilo propio)
// y a las acciones destructivas sin ninguna confirmacion -mismo componente
// para "Cancelar anuncio" (paciente) y "Retirar postulacion" (cuidador).
export function ConfirmDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  confirmando,
  onConfirmar,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button type="button" variant="destructive" disabled={confirmando} onClick={onConfirmar}>
            {confirmando ? "Un momento…" : textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
