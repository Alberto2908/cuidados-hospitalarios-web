"use client";

import { Estrellas } from "@/components/ui/estrellas";
import { formatearFecha } from "@/lib/fecha";
import type { Resena } from "@/lib/api/resenas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalResenasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resenas: Resena[];
}

export default function ModalResenas({ open, onOpenChange, resenas }: ModalResenasProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {resenas.map((resena) => (
            <div key={resena.id} className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{resena.autorNombre}</p>
                <span className="text-xs text-muted-foreground">{formatearFecha(resena.creadoEn)}</span>
              </div>
              <Estrellas valor={resena.valoracion} className="mt-1" />
              <p className="mt-2 text-sm text-muted-foreground">{resena.comentario}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
