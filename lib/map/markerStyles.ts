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
  if (color === "sky") {
    return {
      bg: selected ? "#0369a1" : "#ffffff",
      text: selected ? "#ffffff" : "#0369a1",
      border: selected ? "#0ea5e9" : "#bae6fd",
      glow: selected ? "rgba(14,165,233,0.45)" : "rgba(14,165,233,0.18)",
      pulse: "rgba(14,165,233,0.4)",
      icon: selected ? "#ffffff" : "#0ea5e9",
      accent: "#0369a1",
      solid: selected ? "#0284c7" : "#0ea5e9",
    };
  }
  return {
    bg: selected ? "#065f46" : "#ffffff",
    text: selected ? "#ffffff" : "#065f46",
    border: selected ? "#10b981" : "#a7f3d0",
    glow: selected ? "rgba(16,185,129,0.45)" : "rgba(16,185,129,0.18)",
    pulse: "rgba(16,185,129,0.4)",
    icon: selected ? "#ffffff" : "#10b981",
    accent: "#065f46",
    solid: selected ? "#047857" : "#10b981",
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
  const bg = selected ? p.solid : "#fff";
  const border = selected ? p.solid : hover ? p.solid : p.border;
  const shadow = hover
    ? `0 6px 16px ${p.glow}`
    : `0 2px 10px ${p.glow},0 1px 3px rgba(0,0,0,0.06)`;
  const textColor = selected ? "#fff" : p.accent;

  return {
    html: `
      <div style="
        min-width:${W}px;height:${H}px;padding:0 12px;border-radius:999px;
        background:${bg};border:2px solid ${border};
        box-shadow:${shadow};display:flex;align-items:center;justify-content:center;
        font-family:system-ui,sans-serif;font-size:13px;font-weight:800;
        color:${textColor};cursor:pointer;${scale}
      ">${count}</div>`,
    iconSize: [W, H],
    iconAnchor: [W / 2, H / 2],
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
        <div style="position:absolute;inset:0;border-radius:50%;background:${p.pulse};animation:marker-pulse 2.4s ease-out infinite;"></div>
        <div style="
          position:relative;width:${S}px;height:${S}px;border-radius:50%;
          background:#fff;border:2.5px solid ${p.border};
          box-shadow:0 4px 16px ${p.glow},0 1px 4px rgba(0,0,0,0.08);
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
