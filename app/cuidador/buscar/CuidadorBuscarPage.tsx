"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Clock, X } from "lucide-react";
import { MOCK_HOSPITALES } from "@/lib/mock/hospitales";
import { MOCK_ANUNCIOS, Anuncio } from "@/lib/mock/anuncios";
import type { HospitalMarker, MapBounds } from "@/components/map/MapaHospitales";
import BuscadorUbicacion from "@/components/map/BuscadorUbicacion";
import BotonMiUbicacion from "@/components/map/BotonMiUbicacion";
import type { GeocodeResult } from "@/lib/geocoding/nominatim";

const MapaHospitales = dynamic(() => import("@/components/map/MapaHospitales"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
});

const TURNO_LABEL: Record<Anuncio["turno"], string> = {
  mañana: "Mañana", tarde: "Tarde", noche: "Noche", flexible: "Flexible",
};

const TURNO_COLOR: Record<Anuncio["turno"], string> = {
  mañana:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  tarde:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  noche:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  flexible: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

function hospitalEnBounds(h: { lat: number; lng: number }, b: MapBounds | null) {
  if (!b) return true;
  return h.lat >= b.south && h.lat <= b.north && h.lng >= b.west && h.lng <= b.east;
}

export default function CuidadorBuscarPage() {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [filtroTurno, setFiltroTurno] = useState<Anuncio["turno"] | "todos">("todos");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const anunciosActivos = useMemo(() => MOCK_ANUNCIOS.filter((a) => a.estado === "activo"), []);

  const markers: HospitalMarker[] = useMemo(
    () =>
      MOCK_HOSPITALES.map((h) => ({
        hospital: h,
        count: anunciosActivos.filter((a) => a.hospitalId === h.id).length,
        color: "sky" as const,
      })).filter((m) => m.count > 0),
    [anunciosActivos],
  );

  const anunciosFiltrados = useMemo(() => {
    return anunciosActivos.filter((a) => {
      const hospital = MOCK_HOSPITALES.find((h) => h.id === a.hospitalId);
      const enVista = hospital ? hospitalEnBounds(hospital, bounds) : false;
      const coincideHosp = selectedHospitalId ? a.hospitalId === selectedHospitalId : true;
      const coincideTurno = filtroTurno === "todos" || a.turno === filtroTurno;
      return enVista && coincideHosp && coincideTurno;
    });
  }, [anunciosActivos, bounds, selectedHospitalId, filtroTurno]);

  const hospitalSeleccionado = MOCK_HOSPITALES.find((h) => h.id === selectedHospitalId);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedHospitalId((prev) => (prev === id ? null : id));
  }, []);

  const handleBoundsChange = useCallback((b: MapBounds) => setBounds(b), []);

  const handleSearchSelect = useCallback((result: GeocodeResult) => {
    setFocusTarget({ lat: result.lat, lng: result.lng, zoom: result.zoom });
    setSelectedHospitalId(result.hospitalId ?? null);
  }, []);

  const handleMiUbicacion = useCallback(
    (coords: { lat: number; lng: number; zoom: number }) => {
      setFocusTarget(coords);
      setSelectedHospitalId(null);
    },
    [],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Buscar anuncios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La lista muestra solo los anuncios de los hospitales visibles en el mapa
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        <div className="relative h-[420px] lg:h-[580px] lg:flex-1 rounded-xl overflow-hidden border border-border shadow-sm">
          <MapaHospitales
            markers={markers}
            onHospitalClick={handleMarkerClick}
            onBoundsChange={handleBoundsChange}
            selectedHospitalId={selectedHospitalId}
            focusTarget={focusTarget}
          />
        </div>

        <div className="flex w-full flex-col overflow-hidden bg-background lg:w-80 lg:h-[580px]">
          <div className="shrink-0 px-1 py-1">
            <div className="mb-3">
              <BuscadorUbicacion
                onSelect={handleSearchSelect}
                trailing={<BotonMiUbicacion onLocated={handleMiUbicacion} />}
              />
            </div>

            {hospitalSeleccionado && (
              <div className="mb-3 flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filtrando por</p>
                  <p className="mt-0.5 font-semibold text-foreground leading-tight">{hospitalSeleccionado.nombre}</p>
                </div>
                <button
                  onClick={() => setSelectedHospitalId(null)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {(["todos", "mañana", "tarde", "noche", "flexible"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTurno(t)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filtroTurno === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {t === "todos" ? "Todos" : TURNO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="scrollbar-subtle flex flex-1 flex-col gap-3 overflow-y-auto px-1 py-3">
            {anunciosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p>No hay anuncios en la zona</p>
                <p className="text-xs">Aleja el mapa o desplázate para ver más</p>
              </div>
            ) : (
              anunciosFiltrados.map((anuncio) => {
                const hospital = MOCK_HOSPITALES.find((h) => h.id === anuncio.hospitalId);
                return (
                  <div
                    key={anuncio.id}
                    className="rounded-2xl bg-muted/20 p-4 shadow-sm transition-all hover:bg-muted/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground text-sm leading-snug">{anuncio.titulo}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TURNO_COLOR[anuncio.turno]}`}>
                        <Clock className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                        {TURNO_LABEL[anuncio.turno]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{anuncio.descripcion}</p>
                    {hospital && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{hospital.nombre}</span>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {anuncio.necesidades.slice(0, 3).map((n) => (
                        <span key={n} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 px-1 py-2 text-xs text-muted-foreground">
            {anunciosFiltrados.length} {anunciosFiltrados.length === 1 ? "anuncio" : "anuncios"} en la zona
          </div>
        </div>
      </div>
    </div>
  );
}
