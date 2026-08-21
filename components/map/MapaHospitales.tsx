"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, MarkerClusterGroup } from "leaflet";
import { Hospital } from "@/lib/mock/hospitales";
// Estilo activo: CARTO Voyager. Si se implementa modo oscuro → DARK_MAP_STYLE_ID (carto-dark).
import { DEFAULT_MAP_STYLE_ID, getMapTileStyle } from "@/lib/map/tileStyles";
// Individuales: píldora. Clusters: burbuja suave con cruz de hospital.
import {
  buildClusterSoftBubbleHtml,
  buildMarkerHtml,
} from "@/lib/map/markerStyles";

export interface HospitalMarker {
  hospital: Hospital;
  count: number;
  color: "sky" | "emerald";
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface Props {
  markers: HospitalMarker[];
  onHospitalClick: (hospitalId: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  selectedHospitalId?: string | null;
  /** Cuando cambia, el mapa hace flyTo a esa ubicación */
  focusTarget?: { lat: number; lng: number; zoom: number } | null;
  /** Id de estilo de tiles (ver lib/map/tileStyles) */
  tileStyleId?: string;
}

interface HospitalMarkerOptions {
  hospitalId: string;
  resultCount: number;
  markerColor: "sky" | "emerald";
}

const PULSE_CSS = `
@keyframes marker-pulse {
  0%   { transform: scale(1);   opacity: 0.55; }
  60%  { transform: scale(1.9); opacity: 0;    }
  100% { transform: scale(1.9); opacity: 0;    }
}
.leaflet-tooltip.custom-tooltip {
  background: #fff !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 10px !important;
  padding: 7px 11px !important;
  box-shadow: 0 4px 14px rgba(0,0,0,0.1) !important;
  font-family: system-ui, -apple-system, sans-serif !important;
  pointer-events: none;
}
.leaflet-tooltip.custom-tooltip::before { border-top-color: #e5e7eb !important; }
.marker-cluster-custom {
  background: transparent !important;
  border: none !important;
}
`;

function loadLeafletWithCluster(): Promise<typeof import("leaflet")> {
  return import("leaflet").then(async (leafletModule) => {
    const L = leafletModule.default ?? leafletModule;
    if (typeof window !== "undefined") {
      (window as Window & { L?: typeof L }).L = L;
    }
    await import("leaflet.markercluster");
    return L;
  });
}

function isMapAlive(map: LeafletMap | null): map is LeafletMap {
  if (!map) return false;
  try {
    const container = map.getContainer();
    return Boolean(container?.isConnected);
  } catch {
    return false;
  }
}

function buildIcon(
  L: typeof import("leaflet"),
  count: number,
  color: "sky" | "emerald",
  isSelected: boolean,
) {
  const built = buildMarkerHtml(
    count,
    color,
    isSelected ? "selected" : "default",
  );
  return L.divIcon({
    className: "",
    html: built.html,
    iconSize: built.iconSize,
    iconAnchor: built.iconAnchor,
  });
}

function buildClusterIcon(
  L: typeof import("leaflet"),
  totalCount: number,
  hospitalCount: number,
  color: "sky" | "emerald",
) {
  const built = buildClusterSoftBubbleHtml(totalCount, hospitalCount, color);
  return L.divIcon({
    className: "marker-cluster-custom",
    html: built.html,
    iconSize: built.iconSize,
    iconAnchor: built.iconAnchor,
  });
}

function getMarkerMeta(marker: Marker): HospitalMarkerOptions {
  const options = marker.options as Marker["options"] & Partial<HospitalMarkerOptions>;
  return {
    hospitalId: options.hospitalId ?? "",
    resultCount: options.resultCount ?? 0,
    markerColor: options.markerColor ?? "emerald",
  };
}

function drawMarkers(
  L: typeof import("leaflet"),
  markerGroup: MarkerClusterGroup,
  markers: HospitalMarker[],
  selectedHospitalId: string | null | undefined,
  onClickRef: React.MutableRefObject<(id: string) => void>,
) {
  markerGroup.clearLayers();

  markers.forEach(({ hospital, count, color }) => {
    if (count === 0) return;

    const isSelected = selectedHospitalId === hospital.id;
    const icon = buildIcon(L, count, color, isSelected);
    const marker = L.marker([hospital.lat, hospital.lng], {
      icon,
      hospitalId: hospital.id,
      resultCount: count,
      markerColor: color,
    } as L.MarkerOptions);

    const accentColor = color === "sky" ? "#0369a1" : "#065f46";
    marker.bindTooltip(
      `<div>
        <div style="font-size:13px;font-weight:700;color:#111;">🏥 ${hospital.nombre}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">${hospital.direccion}</div>
        <div style="font-size:12px;font-weight:600;color:${accentColor};margin-top:4px;">
          ${count} ${count === 1 ? "resultado disponible" : "resultados disponibles"}
        </div>
      </div>`,
      { direction: "top", offset: [0, -22], className: "custom-tooltip" },
    );

    marker.on("click", () => onClickRef.current(hospital.id));
    markerGroup.addLayer(marker);
  });
}

/**
 * Radio de cluster en px según zoom.
 * Los hospitales más cercanos del mock están a ~1,75 km (Clínico–FJD).
 * A zoom ≥10 deben verse siempre separados; solo agrupamos al alejar mucho.
 */
function clusterRadiusForZoom(zoom: number): number {
  if (zoom <= 5) return 70;
  if (zoom <= 6) return 48;
  if (zoom <= 7) return 32;
  if (zoom <= 8) return 22;
  if (zoom <= 9) return 14;
  return 8;
}

export default function MapaHospitales({
  markers,
  onHospitalClick,
  onBoundsChange,
  selectedHospitalId,
  focusTarget,
  tileStyleId = DEFAULT_MAP_STYLE_ID,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerGroupRef = useRef<MarkerClusterGroup | null>(null);
  const mapGenRef = useRef(0);

  const onClickRef = useRef(onHospitalClick);
  const onBoundsRef = useRef(onBoundsChange);
  onClickRef.current = onHospitalClick;
  onBoundsRef.current = onBoundsChange;

  /* ── Init mapa ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const gen = ++mapGenRef.current;
    let cancelled = false;

    if (!document.getElementById("mapa-css")) {
      const style = document.createElement("style");
      style.id = "mapa-css";
      style.textContent = PULSE_CSS;
      document.head.appendChild(style);
    }

    loadLeafletWithCluster().then((L) => {
      if (cancelled || gen !== mapGenRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((container as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (container as any)._leaflet_id;
      }
      container.replaceChildren();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(container, {
        center: [40.4168, -3.7038],
        zoom: 11,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      const style = getMapTileStyle(tileStyleId);
      L.tileLayer(style.url, {
        attribution: style.attribution,
        maxZoom: style.maxZoom ?? 19,
        minZoom: style.minZoom ?? 3,
        ...(style.subdomains ? { subdomains: style.subdomains } : {}),
      }).addTo(map);

      const markerGroup = L.markerClusterGroup({
        // A partir de zoom 10 (área metropolitana) todos los hospitales van sueltos
        disableClusteringAtZoom: 10,
        maxClusterRadius: clusterRadiusForZoom,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        animate: true,
        animateAddingMarkers: false,
        iconCreateFunction: (cluster) => {
          const children = cluster.getAllChildMarkers();
          const totalCount = children.reduce(
            (sum, child) => sum + getMarkerMeta(child).resultCount,
            0,
          );
          const color = getMarkerMeta(children[0]).markerColor;
          return buildClusterIcon(L, totalCount, children.length, color);
        },
      }).addTo(map);

      map.zoomControl.setPosition("topright");
      mapRef.current = map;
      markerGroupRef.current = markerGroup;

      const emitBounds = () => {
        if (!isMapAlive(map)) return;
        const b = map.getBounds();
        onBoundsRef.current({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      };

      map.on("moveend", emitBounds);
      map.on("zoomend", emitBounds);
      map.whenReady(emitBounds);

      drawMarkers(L, markerGroup, markers, selectedHospitalId, onClickRef);
    });

    return () => {
      cancelled = true;
      mapGenRef.current += 1;

      markerGroupRef.current = null;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((container as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (container as any)._leaflet_id;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Actualizar marcadores ── */
  useEffect(() => {
    const markerGroup = markerGroupRef.current;
    if (!isMapAlive(mapRef.current) || !markerGroup) return;

    const gen = mapGenRef.current;
    let cancelled = false;

    loadLeafletWithCluster().then((L) => {
      if (cancelled || gen !== mapGenRef.current) return;
      if (!isMapAlive(mapRef.current) || markerGroupRef.current !== markerGroup) return;

      drawMarkers(L, markerGroup, markers, selectedHospitalId, onClickRef);
    });

    return () => {
      cancelled = true;
    };
  }, [markers, selectedHospitalId]);

  /* ── Centrar mapa al buscar ubicación ── */
  useEffect(() => {
    if (!focusTarget) return;
    const map = mapRef.current;
    if (!isMapAlive(map)) return;
    map.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom, {
      animate: true,
      duration: 0.9,
    });
  }, [focusTarget]);

  return (
    <div ref={containerRef} className="h-full w-full" style={{ touchAction: "auto" }} />
  );
}
