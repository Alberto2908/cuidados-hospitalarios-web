"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Star, X } from "lucide-react";
import { MOCK_HOSPITALES } from "@/lib/mock/hospitales";
import { MOCK_CUIDADORES } from "@/lib/mock/usuarios";
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

const ESPECIALIDADES = Array.from(new Set(MOCK_CUIDADORES.map((c) => c.especialidad))).sort();

function hospitalEnBounds(h: { lat: number; lng: number }, b: MapBounds | null) {
  if (!b) return true;
  return h.lat >= b.south && h.lat <= b.north && h.lng >= b.west && h.lng <= b.east;
}

export default function PacienteBuscarPage() {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("todas");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const cuidadoresActivos = useMemo(
    () => MOCK_CUIDADORES.filter((c) => c.estado === "activo"),
    [],
  );

  const markers: HospitalMarker[] = useMemo(
    () =>
      MOCK_HOSPITALES.map((h) => ({
        hospital: h,
        count: cuidadoresActivos.filter((c) => c.hospitalesDisponibles.includes(h.id)).length,
        color: "emerald" as const,
      })).filter((m) => m.count > 0),
    [cuidadoresActivos],
  );

  const cuidadoresFiltrados = useMemo(() => {
    return cuidadoresActivos.filter((c) => {
      const tieneHospitalVisible = c.hospitalesDisponibles.some((hId) => {
        const h = MOCK_HOSPITALES.find((x) => x.id === hId);
        return h ? hospitalEnBounds(h, bounds) : false;
      });
      const coincideHospital = selectedHospitalId
        ? c.hospitalesDisponibles.includes(selectedHospitalId)
        : true;
      const coincideEspecialidad =
        filtroEspecialidad === "todas" || c.especialidad === filtroEspecialidad;
      return tieneHospitalVisible && coincideHospital && coincideEspecialidad;
    });
  }, [cuidadoresActivos, bounds, selectedHospitalId, filtroEspecialidad]);

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
        <h1 className="text-2xl font-bold text-foreground">Buscar cuidador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La lista muestra solo los cuidadores de los hospitales visibles en el mapa
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

            <div>
              <select
                value={filtroEspecialidad}
                onChange={(e) => setFiltroEspecialidad(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
              >
                <option value="todas">Todas las especialidades</option>
                {ESPECIALIDADES.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="scrollbar-subtle flex flex-1 flex-col gap-3 overflow-y-auto px-1 py-3">
            {cuidadoresFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p>No hay cuidadores en la zona</p>
                <p className="text-xs">Aleja el mapa o desplázate para ver más</p>
              </div>
            ) : (
              cuidadoresFiltrados.map((cuidador) => (
                <div
                  key={cuidador.id}
                  className="rounded-2xl bg-muted/20 p-4 shadow-sm transition-all hover:bg-muted/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {cuidador.nombre[0]}{cuidador.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-medium text-foreground text-sm">
                          {cuidador.nombre} {cuidador.apellido}
                        </p>
                        <span className="shrink-0 flex items-center gap-0.5 text-xs font-medium text-amber-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {cuidador.valoracion}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cuidador.especialidad}</p>
                      <p className="text-xs text-muted-foreground">{cuidador.experienciaAnios} años de experiencia</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cuidador.hospitalesDisponibles.map((hId) => {
                          const h = MOCK_HOSPITALES.find((x) => x.id === hId);
                          if (!h) return null;
                          const isActive = selectedHospitalId === hId;
                          const isVisible = hospitalEnBounds(h, bounds);
                          if (!isVisible) return null;
                          return (
                            <span
                              key={hId}
                              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <MapPin className="h-2.5 w-2.5" />
                              {h.nombre.replace("Hospital ", "").replace("Universitario ", "")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 px-1 py-2 text-xs text-muted-foreground">
            {cuidadoresFiltrados.length} {cuidadoresFiltrados.length === 1 ? "cuidador" : "cuidadores"} en la zona
          </div>
        </div>
      </div>
    </div>
  );
}
