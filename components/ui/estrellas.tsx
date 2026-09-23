import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface EstrellasProps {
  /** Valoración de 0 a 5. Admite decimales: se redondea a la media estrella más cercana. */
  valor: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * 5 estrellas en gris como base + una capa recortada por porcentaje con las
 * mismas 5 en amarillo por encima: así una valoración de 4.5 pinta 4
 * estrellas llenas y la 5ª mitad llena mitad vacía, sin tener que dibujar un
 * icono de "media estrella" a mano. Funciona para cualquier decimal (4.3 se
 * ve igual que 4.5, redondeado al 10% más cercano) porque el recorte es un
 * porcentaje continuo, no un número de estrellas.
 */
export function Estrellas({ valor, size = "sm", className }: EstrellasProps) {
  const porcentaje = Math.max(0, Math.min(100, (valor / 5) * 100));
  const tamano = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <span className={cn("relative inline-flex", className)} aria-label={`${valor} de 5 estrellas`}>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn(tamano, "text-muted-foreground/30")} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${porcentaje}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn(tamano, "shrink-0 fill-amber-400 text-amber-400")} />
        ))}
      </span>
    </span>
  );
}
