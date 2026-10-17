"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Texto para lectores de pantalla que explica que se esta eligiendo. */
  ariaLabel: string;
  className?: string;
  /** "radio" para elegir un ajuste (p. ej. el tema); "tabs" (por defecto) para cambiar de vista. */
  tipo?: "tabs" | "radio";
}

/**
 * Selector de pastilla con indicador deslizante: al cambiar de opcion el fondo
 * se desplaza (no salta) hasta la nueva. Mismo estilo que los enlaces del
 * navbar (pastilla `bg-card` con la opcion activa en `bg-primary`). Todas las
 * opciones tienen el mismo ancho para que el indicador se calcule solo con
 * `translateX`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  tipo = "tabs",
}: SegmentedControlProps<T>) {
  const indiceActivo = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      role={tipo === "radio" ? "radiogroup" : "tablist"}
      aria-label={ariaLabel}
      className={cn("relative inline-grid rounded-full bg-card p-1 shadow-soft", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${indiceActivo * 100}%)`,
        }}
      />
      {options.map((opcion) => {
        const activa = opcion.value === value;
        return (
          <button
            key={opcion.value}
            type="button"
            role={tipo === "radio" ? "radio" : "tab"}
            {...(tipo === "radio" ? { "aria-checked": activa } : { "aria-selected": activa })}
            onClick={() => onChange(opcion.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium transition-colors duration-300",
              activa ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcion.icon}
            {opcion.label}
          </button>
        );
      })}
    </div>
  );
}
