"use client";

import { Bar, BarChart as RechartsBarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BarChartDato {
  label: string;
  value: number;
  color: string;
  /** Texto adicional para el tooltip (p.ej. la ciudad de un hospital). */
  sublabel?: string;
}

interface BarChartProps {
  data: BarChartDato[];
  height?: number;
  orientation?: "vertical" | "horizontal";
  valueFormatter?: (v: number) => string;
}

const ALTURA_FILA_HORIZONTAL = 44;
const ESTILO_TOOLTIP = {
  backgroundColor: "var(--color-background)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

interface TooltipPayloadItem {
  payload: BarChartDato;
}

function TooltipBarras({ active, payload, valueFormatter }: { active?: boolean; payload?: TooltipPayloadItem[]; valueFormatter: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const dato = payload[0].payload;
  return (
    <div style={ESTILO_TOOLTIP} className="px-2.5 py-1.5">
      <p className="font-medium text-foreground">
        {dato.label}
        {dato.sublabel && <span className="text-muted-foreground"> · {dato.sublabel}</span>}
      </p>
      <p className="text-muted-foreground">{valueFormatter(dato.value)}</p>
    </div>
  );
}

/** Barras categoricas (Recharts): una serie con color fijo por dato, etiqueta de valor en la punta, tooltip al pasar el raton. */
export default function BarChart({ data, height = 220, orientation = "vertical", valueFormatter = String }: BarChartProps) {
  const horizontal = orientation === "horizontal";
  const alturaFinal = horizontal ? Math.max(height, data.length * ALTURA_FILA_HORIZONTAL + 16) : height;

  return (
    <ResponsiveContainer width="100%" height={alturaFinal}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 16, right: horizontal ? 36 : 8, left: horizontal ? 8 : -20, bottom: 0 }}
        barCategoryGap={horizontal ? 12 : "24%"}
      >
        {horizontal ? (
          <>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval={0}
            />
            <YAxis hide allowDecimals={false} />
          </>
        )}
        <Tooltip
          content={<TooltipBarras valueFormatter={valueFormatter} />}
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
        />
        <Bar dataKey="value" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontal ? 30 : 24} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
          <LabelList
            dataKey="value"
            position={horizontal ? "right" : "top"}
            formatter={(v: unknown) => valueFormatter(Number(v))}
            style={{ fontSize: 11, fill: "var(--color-foreground)", fontWeight: 500 }}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
