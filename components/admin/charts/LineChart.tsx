"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LineChartSerie {
  key: string;
  label: string;
  color: string;
}

interface LineChartProps {
  /** Cada punto trae una etiqueta (dia/mes/año, segun quien llame) y un valor numerico por cada serie.key. */
  data: Array<{ etiqueta: string; [serieKey: string]: string | number }>;
  series: LineChartSerie[];
  height?: number;
  /** Formatea la etiqueta del eje X y del tooltip; por defecto asume "YYYY-MM-DD" -> "DD/MM". */
  formatearEtiqueta?: (etiqueta: string) => string;
}

const ESTILO_TOOLTIP = {
  backgroundColor: "var(--color-background)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

/** Linea con hasta N series (Recharts): leyenda cuando hay mas de una, tooltip con crosshair al pasar el raton, ejes recesivos. */
export default function LineChart({ data, series, height = 240, formatearEtiqueta = formatearFechaCorta }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="etiqueta"
          tickFormatter={formatearEtiqueta}
          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          labelFormatter={(valor) => formatearEtiqueta(String(valor))}
          contentStyle={ESTILO_TOOLTIP}
          cursor={{ stroke: "var(--color-muted-foreground)", strokeDasharray: "3 3" }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-background)" }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

function formatearFechaCorta(fechaIso: string): string {
  const [, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}`;
}
