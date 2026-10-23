"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import { useIndicadorDeslizante } from "@/lib/ui/useIndicadorDeslizante";

export interface OpcionFiltro<T extends string> {
  value: T;
  label: string;
  /** Numero que se muestra en una burbuja junto a la etiqueta (p. ej. pendientes). */
  conteo?: number;
}

interface FiltroDeslizanteProps<T extends string> {
  options: OpcionFiltro<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Texto para lectores de pantalla que explica que se esta filtrando. */
  ariaLabel: string;
  /** "md" para pestañas principales de una pagina; "sm" (por defecto) para filtros compactos. */
  tamano?: "sm" | "md";
  className?: string;
}

/**
 * Fila de filtros en pastilla con el mismo indicador deslizante que el navbar
 * (`useIndicadorDeslizante`): el fondo violeta se desplaza hasta la opcion
 * elegida y mide cada opcion, asi que sirve con anchos distintos. A diferencia
 * de `SegmentedControl` (todas las opciones del mismo ancho), aqui cada opcion
 * ocupa lo que necesita su texto.
 */
export function FiltroDeslizante<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tamano = "sm",
  className,
}: FiltroDeslizanteProps<T>) {
  const { contenedor, registrar, estiloIndicador } = useIndicadorDeslizante(
    value,
    options.map((o) => o.value).join("|"),
  );

  return (
    <div
      ref={contenedor as RefObject<HTMLDivElement>}
      role="tablist"
      aria-label={ariaLabel}
      className={cn("relative inline-flex max-w-full items-stretch gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-soft", className)}
    >
      <span aria-hidden className="pointer-events-none absolute rounded-full bg-primary" style={estiloIndicador} />
      {options.map((opcion) => {
        const activa = opcion.value === value;
        return (
          <button
            key={opcion.value}
            ref={registrar(opcion.value)}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => onChange(opcion.value)}
            className={cn(
              "relative z-10 flex shrink-0 items-center gap-2 rounded-full font-medium transition-colors duration-300",
              tamano === "md" ? "px-4 py-2 text-sm" : "px-3.5 py-2 text-xs",
              activa ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcion.label}
            {opcion.conteo !== undefined && (
              // Mismo contador que el de los enlaces del navbar: circulo violeta y, sobre la
              // opcion activa (que ya es violeta), invertido para que no se pierda.
              <span
                className={cn(
                  "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-normal transition-colors duration-300",
                  activa ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground",
                )}
              >
                {opcion.conteo}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
