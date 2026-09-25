export type MarkerTone = "emerald" | "sky";
export type MarkerVisualState = "default" | "hover" | "selected";

type Palette = {
  bg: string;
  text: string;
  border: string;
  glow: string;
  pulse: string;
  icon: string;
  accent: string;
  solid: string;
};

function tone(color: MarkerTone, selected: boolean): Palette {
  if (selected) {
    // Seleccionado / hover desde la lista: siempre marca (violeta), gane el
    // tono que gane, para que destaque igual en pacientes y cuidadores.
    return {
      bg: "var(--primary)",
      text: "var(--primary-foreground)",
      border: "var(--primary)",
      glow: "var(--shadow-primary)",
      pulse: "color-mix(in oklch, var(--primary) 35%, transparent)",
      icon: "var(--primary-foreground)",
      accent: "var(--primary)",
      solid: "var(--primary)",
    };
  }
  if (color === "sky") {
    return {
      bg: "var(--card)",
      text: "#0369a1",
      border: "#bae6fd",
      glow: "var(--shadow-float)",
      pulse: "rgba(14,165,233,0.4)",
      icon: "#0ea5e9",
      accent: "#0369a1",
      solid: "#0ea5e9",
    };
  }
  return {
    bg: "var(--card)",
    text: "#065f46",
    border: "#a7f3d0",
    glow: "var(--shadow-float)",
    pulse: "rgba(16,185,129,0.4)",
    icon: "#10b981",
    accent: "#065f46",
    solid: "#10b981",
  };
}

const CROSS = (stroke: string, size = 15) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M12 8v8M8 12h8"/>
  </svg>`;

export interface MarkerIconResult {
  html: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
}

function resolveState(
  selectedOrState: boolean | MarkerVisualState,
  hovered?: boolean,
): MarkerVisualState {
  if (typeof selectedOrState === "string") return selectedOrState;
  if (selectedOrState) return "selected";
  if (hovered) return "hover";
  return "default";
}

/** Píldora individual (estilo Airbnb) para un hospital. */
export function buildMarkerHtml(
  count: number,
  color: MarkerTone = "emerald",
  selectedOrState: boolean | MarkerVisualState = false,
  hovered = false,
): MarkerIconResult {
  const state = resolveState(selectedOrState, hovered);
  const selected = state === "selected";
  const hover = state === "hover";
  const p = tone(color, selected);

  const scale = selected
    ? "transform:scale(1.12);"
    : hover
      ? "transform:scale(1.08) translateY(-2px);"
      : "";

  const W = Math.max(38, 22 + String(count).length * 11);
  const H = 34;
  const bg = p.bg;
  const border = selected ? p.solid : hover ? p.solid : p.border;
  const shadow = selected ? "var(--shadow-primary)" : hover ? "var(--shadow-float)" : "var(--shadow-soft)";
  const textColor = p.text;

  const ring = selected
    ? `<div class="marker-pulse-ring" style="position:absolute;inset:0;border-radius:999px;background:${p.pulse};animation:marker-pulse 2.4s ease-out infinite;"></div>`
    : "";

  return {
    html: `
      <div style="position:relative;${scale}">
        ${ring}
        <div style="
          position:relative;min-width:${W}px;height:${H}px;padding:0 12px;border-radius:999px;
          background:${bg};border:2px solid ${border};
          box-shadow:${shadow};display:flex;align-items:center;justify-content:center;
          font-family:system-ui,sans-serif;font-size:13px;font-weight:800;
          color:${textColor};cursor:pointer;
        ">${count}</div>
      </div>`,
    iconSize: [W, H],
    iconAnchor: [W / 2, H / 2],
  };
}

/**
 * Punto de "mi ubicación" (estilo Google Maps): círculo azul sólido con
 * borde blanco y un halo que pulsa (misma animación @keyframes marker-pulse
 * que ya se inyecta en MapaHospitales para los demás marcadores).
 */
export function buildMiUbicacionHtml(): MarkerIconResult {
  const S = 22;
  return {
    html: `
      <div style="position:relative;width:${S}px;height:${S}px;">
        <div class="marker-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.35);animation:marker-pulse 2.4s ease-out infinite;"></div>
        <div style="
          position:relative;width:${S}px;height:${S}px;border-radius:50%;
          background:#2563eb;border:3px solid var(--card);
          box-shadow:var(--shadow-soft);
        "></div>
      </div>`,
    iconSize: [S, S],
    iconAnchor: [S / 2, S / 2],
  };
}

/**
 * Cluster de hospitales: burbuja suave con cruz + nº de hospitales agrupados.
 * El conteo de anuncios/cuidadores queda en las píldoras individuales.
 */
export function buildClusterSoftBubbleHtml(
  _totalCount: number,
  hospitalCount: number,
  color: MarkerTone = "emerald",
): MarkerIconResult {
  const p = tone(color, false);
  const S = 62;
  const label = hospitalCount === 1 ? "hospital" : "hospitales";
  return {
    html: `
      <div style="position:relative;width:${S}px;height:${S}px;">
        <div class="marker-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:${p.pulse};animation:marker-pulse 2.4s ease-out infinite;"></div>
        <div style="
          position:relative;width:${S}px;height:${S}px;border-radius:50%;
          background:var(--card);border:2.5px solid ${p.border};
          box-shadow:var(--shadow-float);
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
          font-family:system-ui,sans-serif;cursor:pointer;
        ">
          ${CROSS(p.icon, 13)}
          <span style="font-size:16px;font-weight:800;color:${p.accent};line-height:1;">${hospitalCount}</span>
          <span style="
            font-size:8px;font-weight:600;color:${p.accent};line-height:1;opacity:0.85;
            letter-spacing:0.02em;
          ">${label}</span>
        </div>
      </div>`,
    iconSize: [S, S],
    iconAnchor: [S / 2, S / 2],
  };
}
