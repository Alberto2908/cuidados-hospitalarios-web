import type { ComponentType, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface AvisoAdvertenciaProps {
  children: ReactNode;
  icono?: ComponentType<{ className?: string }>;
  className?: string;
}

/** Caja ámbar con icono para advertencias dentro de una tarjeta (lo que falta, lo que se pierde, lo que se espera). */
export function AvisoAdvertencia({ children, icono: Icono = AlertTriangle, className = "" }: AvisoAdvertenciaProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 ${className}`}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
