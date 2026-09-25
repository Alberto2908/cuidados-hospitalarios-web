"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { MapPin, Star, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchTodosLosHospitales } from "@/lib/api/hospitales";
import { formatearAntiguedad } from "@/lib/fecha";
import {
  fetchConteoCuidadoresPorHospitales,
  fetchCuidadoresPorHospitales,
  type CuidadorPublico,
  type OrdenCuidadores,
} from "@/lib/api/cuidadores";
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

// especialidad todavia no existe en el modelo real de cuidador (ver TODO.md,
// "Ampliar perfil_cuidador"). Mientras tanto se muestra este valor fijo en
// vez de romper la tarjeta. La valoracion, la antiguedad y los cuidados
// realizados SI son datos reales (ver CuidadorPublico).
const DEFAULT_ESPECIALIDAD = "Cuidado general";
const TAMANO_PAGINA = 20;

const OPCIONES_ORDEN: { valor: OrdenCuidadores; etiqueta: string }[] = [
  { valor: "nombre", etiqueta: "Alfabético" },
  { valor: "valoracion", etiqueta: "Valoración" },
  { valor: "cuidados", etiqueta: "Cuidados realizados" },
];

function hospitalEnBounds(h: { lat: number; lng: number }, b: MapBounds | null) {
  if (!b) return true;
  return h.lat >= b.south && h.lat <= b.north && h.lng >= b.west && h.lng <= b.east;
}

export default function PacienteBuscarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // El hospital seleccionado y la vista del mapa (centro+zoom) viven tambien
  // en la URL (?hospital=id&lat=..&lng=..&zoom=..): asi al volver desde la
  // ficha de un cuidador (router.back()) esta pagina no vuelve a montar "en
  // blanco" -lee el filtro y el encuadre del mapa de la propia URL en vez de
  // depender de que React conserve el estado del componente anterior.
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
  const [orden, setOrden] = useState<OrdenCuidadores>("valoracion");

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

  // Se pide UNA vez para todos los hospitales (no solo los visibles): al
  // alejar el zoom, idsVisibles podia llegar a incluir cientos de
  // hospitales y la URL con tantos hospitalIds= fallaba (net::ERR_FAILED),
  // dejando conteos vacio y sin ningun marcador en el mapa. Igual que el
  // buscador de fitnesspark.es, que carga todos sus clubes de una vez y
  // agrupa en el cliente, en vez de re-pedir datos en cada bounds change.
  const { data: conteos = {} } = useQuery({
    queryKey: ["cuidadores", "conteo", idsTodos],
    queryFn: () => fetchConteoCuidadoresPorHospitales(idsTodos),
    enabled: idsTodos.length > 0,
    staleTime: 60 * 1000,
  });

  const markers: HospitalMarker[] = useMemo(
    () =>
      hospitalesVisibles
        .map((h) => ({ hospital: h, count: conteos[h.id] ?? 0, color: "emerald" as const }))
        .filter((m) => m.count > 0),
    [hospitalesVisibles, conteos],
  );

  // useInfiniteQuery en vez de un estado+efecto manual: cambiar de hospital
  // cambia la queryKey y react-query reinicia las paginas solo, sin
  // necesidad de sincronizar nada "a mano" (evita el anti-patron de hacer
  // setState dentro de un efecto para derivar estado de otro estado).
  const {
    data: cuidadoresData,
    fetchNextPage,
    hasNextPage,
    isFetching: cargandoCuidadores,
  } = useInfiniteQuery({
    queryKey: ["cuidadores", "busqueda", selectedHospitalId, orden],
    queryFn: ({ pageParam }) =>
      fetchCuidadoresPorHospitales([selectedHospitalId as string], pageParam, TAMANO_PAGINA, orden),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: Boolean(selectedHospitalId),
  });

  const cuidadores: CuidadorPublico[] = useMemo(
    () => cuidadoresData?.pages.flatMap((p) => p.content) ?? [],
    [cuidadoresData],
  );
  const totalCuidadores = cuidadoresData?.pages[0]?.totalElements ?? 0;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Buscar cuidador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona un hospital en el mapa para ver los cuidadores disponibles ahí
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

            {selectedHospitalId && (
              <div className="mb-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Ordenar por</span>
                <Select
                  value={orden}
                  onValueChange={(value) => setOrden(value as OrdenCuidadores)}
                  items={OPCIONES_ORDEN.map((opcion) => ({ value: opcion.valor, label: opcion.etiqueta }))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {OPCIONES_ORDEN.map((opcion) => (
                      <SelectItem key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="scrollbar-subtle flex flex-1 flex-col gap-3 overflow-y-auto px-1 pb-3">
            {!selectedHospitalId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p>Selecciona un hospital en el mapa</p>
                <p className="text-xs">Los marcadores muestran cuántos cuidadores hay disponibles</p>
              </div>
            ) : cuidadores.length === 0 && !cargandoCuidadores ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-30" />
                <p>No hay cuidadores en este hospital</p>
              </div>
            ) : (
              <>
                {cuidadores.map((cuidador) => (
                  <TarjetaCuidador key={cuidador.id} cuidador={cuidador} />
                ))}
                {hasNextPage && (
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={cargandoCuidadores}
                    className="rounded-lg border border-input bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    {cargandoCuidadores ? "Cargando…" : "Cargar más"}
                  </button>
                )}
              </>
            )}
          </div>

          {selectedHospitalId && cuidadoresData && (
            <div className="shrink-0 px-1 py-2 text-xs text-muted-foreground">
              {totalCuidadores} {totalCuidadores === 1 ? "cuidador" : "cuidadores"} en este hospital
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetaCuidador({ cuidador }: { cuidador: CuidadorPublico }) {
  return (
    <Link
      href={`/cuidadores/${cuidador.id}`}
      className="block rounded-2xl bg-muted/20 p-4 shadow-sm transition-all hover:bg-muted/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {cuidador.nombre[0]}
          {cuidador.apellidos[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="font-medium text-foreground text-sm">
              {cuidador.nombre} {cuidador.apellidos}
            </p>
            <span className="shrink-0 flex items-center gap-0.5 text-xs font-medium text-amber-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {(cuidador.valoracionMedia ?? 0).toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{DEFAULT_ESPECIALIDAD}</p>
          <p className="text-xs text-muted-foreground">Antigüedad: {formatearAntiguedad(cuidador.cuidadorDesde)}</p>
          <p className="text-xs text-muted-foreground">Cuidados realizados: {cuidador.cuidadosRealizados}</p>
        </div>
      </div>
    </Link>
  );
}
