"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search, X, MapPin, Building2, Loader2 } from "lucide-react";
import { matchHospitalesByQuery } from "@/lib/mock/hospitales";
import { geocodeEspana, type GeocodeResult } from "@/lib/geocoding/nominatim";

interface Props {
  onSelect: (result: GeocodeResult) => void;
  /** Acción a la derecha de la etiqueta (p. ej. «Mi ubicación») */
  trailing?: ReactNode;
}

export default function BuscadorUbicacion({ onSelect, trailing }: Props) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounce + búsqueda local + Nominatim
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      // 1) Coincidencias locales de hospitales (instantáneas y precisas)
      const hospitalResults: GeocodeResult[] = matchHospitalesByQuery(q).map((h) => ({
        id: `hosp-${h.id}`,
        label: h.nombre,
        detail: `${h.direccion}, ${h.codigoPostal} ${h.ciudad}`,
        lat: h.lat,
        lng: h.lng,
        zoom: 15,
        source: "hospital",
        hospitalId: h.id,
      }));

      try {
        // 2) Geocoding externo (ciudad, CP, calle…)
        const geoResults = await geocodeEspana(q, controller.signal);

        // Evitar duplicados muy cercanos a hospitales ya listados
        const merged = [...hospitalResults];
        for (const g of geoResults) {
          const dup = hospitalResults.some(
            (h) => Math.abs(h.lat - g.lat) < 0.002 && Math.abs(h.lng - g.lng) < 0.002,
          );
          if (!dup) merged.push(g);
        }

        if (!controller.signal.aborted) {
          setSuggestions(merged.slice(0, 8));
          setOpen(true);
          setLoading(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        // Si falla la API, al menos mostramos hospitales locales
        setSuggestions(hospitalResults);
        setOpen(hospitalResults.length > 0);
        setLoading(false);
        if (hospitalResults.length === 0) {
          setError(err instanceof Error ? err.message : "No se pudo buscar la ubicación");
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function handleSelect(result: GeocodeResult) {
    setQuery(result.label);
    setOpen(false);
    onSelect(result);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (suggestions[0]) {
      handleSelect(suggestions[0]);
      return;
    }
    const q = query.trim();
    if (q.length < 2) return;

    setLoading(true);
    try {
      const local = matchHospitalesByQuery(q);
      if (local[0]) {
        handleSelect({
          id: `hosp-${local[0].id}`,
          label: local[0].nombre,
          detail: `${local[0].direccion}, ${local[0].codigoPostal} ${local[0].ciudad}`,
          lat: local[0].lat,
          lng: local[0].lng,
          zoom: 15,
          source: "hospital",
          hospitalId: local[0].id,
        });
        return;
      }
      const geo = await geocodeEspana(q);
      if (geo[0]) handleSelect(geo[0]);
      else setError("No se encontraron resultados");
    } catch {
      setError("No se pudo buscar la ubicación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
          Introduce la ciudad del hospital
        </label>
        {trailing}
      </div>
      <form onSubmit={handleSubmit} className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={inputId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Ciudad, CP, calle u hospital…"
          autoComplete="off"
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none ring-ring focus:ring-2"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setError(null);
                setOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </form>

      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {s.source === "hospital" ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{s.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
