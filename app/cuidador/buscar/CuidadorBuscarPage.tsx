"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { MapPin, CalendarDays, X } from "lucide-react";
import { fetchTodosLosHospitales } from "@/lib/api/hospitales";
import {
  fetchAnunciosPorHospitales,
  fetchConteoAnunciosPorHospitales,
  type Anuncio,
} from "@/lib/api/anuncios";
import type { HospitalMarker, MapBounds } from "@/components/map/MapaHospitales";
import BuscadorUbicacion from "@/components/map/BuscadorUbicacion";
import BotonMiUbicacion from "@/components/map/BotonMiUbicacion";
import type { GeocodeResult } from "@/lib/geocoding/nominatim";

const MapaHospitales = dynamic(() => import("@/components/map/MapaHospitales"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-sunken text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
});

const TAMANO_PAGINA = 20;

function hospitalEnBounds(h: { lat: number; lng: number }, b: MapBounds | null) {
  if (!b) return true;
  return h.lat >= b.south && h.lat <= b.north && h.lng >= b.west && h.lng <= b.east;
}

export default function CuidadorBuscarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // El hospital seleccionado y la vista del mapa (centro+zoom) viven tambien
  // en la URL (?hospital=id&lat=..&lng=..&zoom=..): asi al volver desde un
  // anuncio (router.back()) esta pagina no vuelve a montar "en blanco" -lee
  // el filtro y el encuadre del mapa de la propia URL. Mismo patron que
  // PacienteBuscarPage.
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    () => searchParams.get("hospital"),
  );
  const [initialView] = useState<{ lat: number; lng: number; zoom: number } | null>(() => {
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    const zoom = parseFloat(searchParams.get("zoom") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(zoom) ? { lat, lng, zoom } : null;
  });
  const [currentView, setCurrentView] = useState(initialView);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [miUbicacion, setMiUbicacion] = useState<{ lat: number; lng: number } | null>(null);

  const handleViewChange = useCallback((view: { lat: number; lng: number; zoom: number }) => {
    setCurrentView(view);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedHospitalId) params.set("hospital", selectedHospitalId);
    else params.delete("hospital");
    if (currentView) {
      params.set("lat", currentView.lat.toFixed(5));
      params.set("lng", currentView.lng.toFixed(5));
      params.set("zoom", String(currentView.zoom));
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    // Solo cuando cambian el hospital o la vista del mapa: si se metieran
    // searchParams o router aqui, el propio replace() dispararia el efecto
    // otra vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHospitalId, currentView]);

  const { data: hospitales = [] } = useQuery({
    queryKey: ["hospitales", "todos"],
    queryFn: fetchTodosLosHospitales,
    staleTime: 10 * 60 * 1000,
  });

  const hospitalesVisibles = useMemo(
    () => hospitales.filter((h) => hospitalEnBounds(h, bounds)),
    [hospitales, bounds],
  );

  const idsTodos = useMemo(() => hospitales.map((h) => h.id).sort(), [hospitales]);

  // Se pide UNA vez para todos los hospitales, no solo los visibles: ver el
  // comentario en PacienteBuscarPage (mismo patron) sobre por que filtrar
  // por bounds aqui rompia el mapa a zooms bajos.
  const { data: conteos = {} } = useQuery({
    queryKey: ["anuncios", "conteo", idsTodos],
    queryFn: () => fetchConteoAnunciosPorHospitales(idsTodos),
    enabled: idsTodos.length > 0,
    staleTime: 60 * 1000,
  });

  const markers: HospitalMarker[] = useMemo(
    () =>
      hospitalesVisibles
        .map((h) => ({ hospital: h, count: conteos[h.id] ?? 0, color: "sky" as const }))
        .filter((m) => m.count > 0),
    [hospitalesVisibles, conteos],
  );

  const {
    data: anunciosData,
    fetchNextPage,
    hasNextPage,
    isFetching: cargandoAnuncios,
  } = useInfiniteQuery({
    queryKey: ["anuncios", "busqueda", selectedHospitalId],
    queryFn: ({ pageParam }) =>
      fetchAnunciosPorHospitales([selectedHospitalId as string], pageParam, TAMANO_PAGINA),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: Boolean(selectedHospitalId),
  });

  const anuncios: Anuncio[] = useMemo(() => anunciosData?.pages.flatMap((p) => p.content) ?? [], [anunciosData]);
  const totalAnuncios = anunciosData?.pages[0]?.totalElements ?? 0;

  const hospitalSeleccionado = hospitales.find((h) => h.id === selectedHospitalId);

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
      setMiUbicacion({ lat: coords.lat, lng: coords.lng });
      setSelectedHospitalId(null);
    },
    [],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Buscar anuncios</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Selecciona un hospital en el mapa para ver los anuncios activos ahí
        </p>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        <div className="relative h-[420px] lg:h-[580px] lg:flex-1 rounded-2xl overflow-hidden bg-surface-sunken shadow-inset-soft">
          <MapaHospitales
            markers={markers}
            onHospitalClick={handleMarkerClick}
            onBoundsChange={handleBoundsChange}
            selectedHospitalId={selectedHospitalId}
            focusTarget={focusTarget}
            miUbicacion={miUbicacion}
            initialView={initialView}
            onViewChange={handleViewChange}
          />
        </div>

        <div className="flex w-full flex-col overflow-hidden bg-background lg:w-80 lg:h-[580px]">
          <div className="shrink-0 px-1 py-1">
            <div className="mb-3">
              <BuscadorUbicacion
                onSelect={handleSearchSelect}
                hospitales={hospitales}
                trailing={<BotonMiUbicacion onLocated={handleMiUbicacion} />}
              />
            </div>

            {hospitalSeleccionado && (
              <div className="mb-3 flex items-start justify-between gap-2 rounded-xl bg-surface-sunken px-3 py-2 shadow-inset-soft">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filtrando por</p>
                  <p className="mt-0.5 font-semibold text-foreground leading-tight">{hospitalSeleccionado.nombre}</p>
                </div>
                <button
                  onClick={() => setSelectedHospitalId(null)}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="scrollbar-subtle flex flex-1 flex-col gap-3 overflow-y-auto px-1 py-3">
            {!selectedHospitalId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p>Selecciona un hospital en el mapa</p>
                <p className="text-xs">Los marcadores muestran cuántos anuncios hay activos</p>
              </div>
            ) : anuncios.length === 0 && !cargandoAnuncios ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p>No hay anuncios en este hospital</p>
              </div>
            ) : (
              <>
                {anuncios.map((anuncio) => (
                  <TarjetaAnuncio key={anuncio.id} anuncio={anuncio} />
                ))}
                {hasNextPage && (
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={cargandoAnuncios}
                    className="rounded-full bg-card py-2 text-sm font-medium text-foreground shadow-soft transition-shadow hover:shadow-float disabled:opacity-60"
                  >
                    {cargandoAnuncios ? "Cargando…" : "Cargar más"}
                  </button>
                )}
              </>
            )}
          </div>

          {selectedHospitalId && anunciosData && (
            <div className="shrink-0 px-1 py-2 text-xs text-muted-foreground">
              {totalAnuncios} {totalAnuncios === 1 ? "anuncio" : "anuncios"} en este hospital
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetaAnuncio({ anuncio }: { anuncio: Anuncio }) {
  return (
    <Link
      href={`/paciente/anuncio/${anuncio.id}`}
      className="block rounded-2xl bg-card p-4 shadow-float transition-shadow duration-200 hover:shadow-[0_8px_24px_oklch(0.29_0.05_265/0.12)]"
    >
      <p className="font-medium text-foreground text-sm leading-snug">{anuncio.titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{anuncio.descripcion}</p>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{anuncio.hospital.nombre}</span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarDays className="h-3 w-3 shrink-0" />
        <span>Publicado por {anuncio.pacienteNombre}</span>
      </div>
    </Link>
  );
}
