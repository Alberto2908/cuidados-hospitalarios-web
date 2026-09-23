import type { ReactNode } from "react";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

/** Formatea numeros grandes de forma compacta (1284 -> "1,284", 12900 -> "12.9K"). */
export function formatearNumeroCompacto(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (valor >= 10_000) return `${(valor / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return valor.toLocaleString("es-ES");
}

export default function StatTile({ icon, label, value, subtext, color = "text-foreground" }: StatTileProps) {
  const textoSecundario = subtext ? `${label} ${subtext}` : label;
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="truncate text-2xl font-semibold text-foreground" title={value}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={textoSecundario}>
        {textoSecundario}
      </p>
    </div>
  );
}
