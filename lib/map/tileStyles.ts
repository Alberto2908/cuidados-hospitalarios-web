export interface MapTileStyle {
  id: string;
  nombre: string;
  proveedor: string;
  descripcion: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
  subdomains?: string;
  /** Ideal para España / etiquetas en español */
  etiquetasEs?: boolean;
  /** Recomendado para la app */
  recomendado?: boolean;
}

/**
 * Estilos de mapa disponibles para comparar y elegir.
 * Todos son tiles públicos (OSM / CARTO / IGN / Esri / Stadia).
 *
 * Estilo activo en la app: CARTO Voyager (`carto-voyager`).
 * TODO (modo oscuro): cuando se implemente dark mode en la UI, cambiar
 * el estilo del mapa a CARTO Dark Matter (`carto-dark`).
 */
export const MAP_TILE_STYLES: MapTileStyle[] = [
  {
    id: "ign-base",
    nombre: "IGN Base",
    proveedor: "Instituto Geográfico Nacional",
    descripcion: "Cartografía oficial española. Etiquetas en español (comunidades, calles).",
    url: "https://www.ign.es/wmts/ign-base?service=WMTS&request=GetTile&version=1.0.0&Format=image/jpeg&layer=IGNBaseTodo&Style=default&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}",
    attribution: '© <a href="https://www.ign.es/">IGN</a> · <a href="https://www.cnig.es/">CNIG</a>',
    maxZoom: 20,
    minZoom: 5,
    etiquetasEs: true,
  },
  {
    id: "carto-voyager",
    nombre: "CARTO Voyager",
    proveedor: "CARTO",
    descripcion: "Estilo colorido y legible, parecido a Google Maps. Buen contraste para marcadores.",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
    recomendado: true,
  },
  {
    id: "carto-positron",
    nombre: "CARTO Positron",
    proveedor: "CARTO",
    descripcion: "Fondo muy claro y minimalista. Ideal si los marcadores deben destacar al máximo.",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "carto-positron-nolabels",
    nombre: "CARTO Positron (sin etiquetas)",
    proveedor: "CARTO",
    descripcion: "Igual que Positron pero sin nombres de calles. Mapa limpio solo de forma.",
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
  },
  // Reservado para modo oscuro: usar este estilo cuando la app tenga dark mode.
  {
    id: "carto-dark",
    nombre: "CARTO Dark Matter",
    proveedor: "CARTO",
    descripcion: "Mapa oscuro. Útil si la UI de la app pasa a modo noche.",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "osm-standard",
    nombre: "OpenStreetMap",
    proveedor: "OpenStreetMap",
    descripcion: "Estilo clásico OSM. Nombres locales (español en España). Muy usado y fiable.",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: "abc",
    etiquetasEs: true,
  },
  {
    id: "osm-hot",
    nombre: "OSM Humanitarian",
    proveedor: "HOT / OSM",
    descripcion: "Más contraste en carreteras y edificios. Bueno para localizar hospitales en ciudad.",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
    subdomains: "abc",
    etiquetasEs: true,
  },
  {
    id: "stadia-alidade",
    nombre: "Stadia Alidade Smooth",
    proveedor: "Stadia Maps",
    descripcion: "Suave y moderno, tipografía limpia. Similar a un mapa de producto SaaS.",
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://stadiamaps.com/">Stadia</a> · © <a href="https://openmaptiles.org/">OMT</a> · © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 20,
  },
  {
    id: "stadia-outdoors",
    nombre: "Stadia Outdoors",
    proveedor: "Stadia Maps",
    descripcion: "Más relieve y color. Útil si quieres un mapa con más personalidad.",
    url: "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://stadiamaps.com/">Stadia</a> · © <a href="https://openmaptiles.org/">OMT</a> · © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 20,
  },
  {
    id: "esri-street",
    nombre: "Esri World Street",
    proveedor: "Esri",
    descripcion: "Estilo tipo Google Maps (calles detalladas). Etiquetas suelen ir en inglés a zoom bajo.",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    maxZoom: 19,
  },
  {
    id: "esri-topo",
    nombre: "Esri World Topo",
    proveedor: "Esri",
    descripcion: "Relieve y topografía. Más “geográfico”, menos urbano.",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    maxZoom: 19,
  },
  {
    id: "opentopomap",
    nombre: "OpenTopoMap",
    proveedor: "OpenTopoMap",
    descripcion: "Mapa topográfico con curvas de nivel. Menos útil para hospitales urbanos.",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '© <a href="https://opentopomap.org">OpenTopoMap</a> · © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 17,
    subdomains: "abc",
  },
];

/** Estilo por defecto (modo claro). Para dark mode → `carto-dark`. */
export const DEFAULT_MAP_STYLE_ID = "carto-voyager";

/** Estilo previsto cuando se active el modo oscuro en la UI. */
export const DARK_MAP_STYLE_ID = "carto-dark";

export function getMapTileStyle(id: string): MapTileStyle {
  return MAP_TILE_STYLES.find((s) => s.id === id) ?? MAP_TILE_STYLES[0];
}
