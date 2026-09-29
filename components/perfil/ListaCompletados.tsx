"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import type { ItemCompletado } from "@/lib/api/cuidadores";
import { formatearFecha } from "@/lib/fecha";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CANTIDAD_PREVIEW = 3;
// En cuadrícula (3 columnas x 3 filas) caben 9 sin scroll.
const CANTIDAD_PREVIEW_CUADRICULA = 9;

interface ListaCompletadosProps {
  titulo: string;
  /** Total real (la lista puede venir recortada a los más recientes). */
  total: number;
  items: ItemCompletado[];
  vacio: string;
  /** Items repartidos en hasta 3 columnas (perfil de paciente, a todo el ancho). */
  enCuadricula?: boolean;
}

function formatearHoras(horas: number): string {
  return `${Number.isInteger(horas) ? horas : horas.toFixed(1)} h`;
}

function Item({ item }: { item: ItemCompletado }) {
  return (
    <div className="rounded-xl bg-accent p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{item.titulo}</p>
        <span className="shrink-0 text-xs text-muted-foreground">{formatearFecha(item.completadoEn)}</span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        {item.hospitalNombre} · {item.hospitalCiudad} · {formatearHoras(item.horas)}
      </p>
    </div>
  );
}

/**
 * Tarjeta de perfil con los últimos anuncios/turnos terminados: se ven los
 * 3 más recientes y el resto (hasta lo que devuelve el backend) en un modal.
 */
export default function ListaCompletados({ titulo, total, items, vacio, enCuadricula = false }: ListaCompletadosProps) {
  const cantidadPreview = enCuadricula ? CANTIDAD_PREVIEW_CUADRICULA : CANTIDAD_PREVIEW;
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="rounded-2xl bg-card p-5 shadow-float">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
        {total > 0 && <span className="text-xs text-muted-foreground">{total} en total</span>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <>
          <div className={enCuadricula ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
            {items.slice(0, cantidadPreview).map((item) => (
              <Item key={`${item.anuncioId}-${item.completadoEn}`} item={item} />
            ))}
          </div>

          {items.length > cantidadPreview && (
            <>
              <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setAbierto(true)}>
                Ver más ({total})
              </Button>

              <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                  </DialogHeader>
                  <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
                    {items.map((item) => (
                      <Item key={`${item.anuncioId}-${item.completadoEn}`} item={item} />
                    ))}
                  </div>
                  {total > items.length && (
                    <p className="text-xs text-muted-foreground">Se muestran los {items.length} más recientes.</p>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}
    </div>
  );
}
