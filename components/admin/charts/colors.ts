// Paleta de las graficas del admin: mismos hex que las clases Tailwind ya
// usadas en el resto del panel (bg-sky-500, bg-emerald-500...) -SVG no puede
// consumir clases Tailwind directamente en stroke/fill, asi que se repiten
// aqui como constantes en vez de inventar una paleta nueva. Los roles
// coinciden con los que ya tiene la app (paciente=sky, cuidador=emerald,
// activo=sky, aceptado=emerald, cancelado/rechazado=red, pendiente=amber).
export const CHART_COLORS = {
  sky: "#0ea5e9",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  orange: "#f97316",
  zinc: "#a1a1aa",
} as const;
