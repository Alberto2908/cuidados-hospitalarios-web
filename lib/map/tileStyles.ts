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
 * CARTO exige API key desde hace poco para sus tiles anónimos
 * (`basemaps.cartocdn.com`, incluye Voyager y Positron): sin ella devuelven
 * una tesela de aviso "API KEY REQUIRED" en vez del mapa -comprobado por HTTP
 * directo, mismo PNG "wm-...-light/dark" sin importar la URL pedida-.
 *
 * Gratis en https://carto.com/basemaps (sin tarjeta, key al momento por
 * email): hasta 5M peticiones/mes no comercial, 1M/mes comercial. Se añade
 * como `?key=` al final de la URL — variable NEXT_PUBLIC_CARTO_API_KEY.
 */
const CARTO_KEY_QS = process.env.NEXT_PUBLIC_CARTO_API_KEY
  ? `?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`
  : "";

/**
 * Estilos de mapa disponibles para comparar y elegir.
 * Todos son tiles públicos (OSM / CARTO / IGN / Esri / Stadia).
 *
 * Estilo activo en la app: ver DEFAULT_MAP_STYLE_ID más abajo -CARTO Voyager
 * si hay NEXT_PUBLIC_CARTO_API_KEY, si no IGN Base como alternativa sin key.
 * Elegido tras comparar los 10 estilos sin key de Stadia en una pagina de
 * prueba (app/estilosmapas, ya borrada).
 * TODO (modo oscuro): cuando se implemente dark mode en la UI, cambiar el
 * estilo del mapa a CARTO Dark Matter (también necesita la key).
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
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_KEY_QS}`,
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
    url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${CARTO_KEY_QS}`,
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
    url: `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png${CARTO_KEY_QS}`,
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
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${CARTO_KEY_QS}`,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
  },
  // Mapa oscuro de la app: Voyager sin etiquetas + etiquetas aparte, invertidos
  // y teñidos con CSS (ver crearCapaBase en MapaHospitales). Se parte de Voyager
  // y no de Dark Matter porque, invertido, conserva jerarquia de carreteras,
  // parques y agua; Dark Matter es casi negro y sus calles apenas se distinguen.
  {
    id: "carto-voyager-nolabels",
    nombre: "CARTO Voyager (sin etiquetas)",
    proveedor: "CARTO",
    descripcion: "Voyager sin nombres. Base del mapa oscuro de la app (se invierte con CSS).",
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png${CARTO_KEY_QS}`,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "carto-voyager-labels",
    nombre: "CARTO Voyager (solo etiquetas)",
    proveedor: "CARTO",
    descripcion: "Solo los nombres, transparente. Se superpone a la base del mapa oscuro.",
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png${CARTO_KEY_QS}`,
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

/**
 * Estilo por defecto: CARTO Voyager si hay NEXT_PUBLIC_CARTO_API_KEY: si no
 * la hay, IGN Base (sin key) para que el mapa nunca se quede sin tiles.
 */
export const DEFAULT_MAP_STYLE_ID = process.env.NEXT_PUBLIC_CARTO_API_KEY ? "carto-voyager" : "ign-base";

/**
 * Estilo del mapa en modo oscuro (necesita la key). Es un identificador
 * "virtual": MapaHospitales lo compone con las dos capas de Voyager + filtros CSS.
 */
export const DARK_MAP_STYLE_ID = "carto-dark";

export function getMapTileStyle(id: string): MapTileStyle {
  return MAP_TILE_STYLES.find((s) => s.id === id) ?? MAP_TILE_STYLES[0];
}
