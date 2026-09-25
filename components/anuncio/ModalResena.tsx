"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalResenaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuidadorNombre: string;
  onEnviar: (valoracion: number, comentario: string) => void;
  enviando: boolean;
}

// Sin useEffect para resetear al reabrir: igual que ModalContraoferta, el
// padre pasa una `key` que cambia cada vez que se abre para que remonte con
// el formulario en blanco.
export default function ModalResena({
  open,
  onOpenChange,
  cuidadorNombre,
  onEnviar,
  enviando,
}: ModalResenaProps) {
  const [valoracion, setValoracion] = useState(0);
  const [valoracionHover, setValoracionHover] = useState(0);
  const [comentario, setComentario] = useState("");

  const valoracionMostrada = valoracionHover || valoracion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valorar a {cuidadorNombre}</DialogTitle>
          <DialogDescription>
            Solo puedes valorar este cuidado una vez. Tu reseña ayuda a otras familias a elegir cuidador.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-1" onMouseLeave={() => setValoracionHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValoracion(n)}
                onMouseEnter={() => setValoracionHover(n)}
                className="p-0.5"
                aria-label={`${n} de 5 estrellas`}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= valoracionMostrada ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="modal-resena-comentario" className="text-sm font-medium text-foreground">
              Comentario (opcional)
            </label>
            <Textarea
              id="modal-resena-comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Cuéntanos cómo fue tu experiencia…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={valoracion === 0 || enviando} onClick={() => onEnviar(valoracion, comentario)}>
            {enviando ? "Enviando…" : "Enviar reseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
