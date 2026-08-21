export interface GeocodeResult {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
  zoom: number;
  source: "hospital" | "geocode";
  hospitalId?: string;
}

interface NominatimItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    road?: string;
    suburb?: string;
    state?: string;
  };
}

function zoomForResult(item: NominatimItem): number {
  const type = `${item.class ?? ""}/${item.type ?? ""}`;
  if (type.includes("postcode") || item.address?.postcode) return 14;
  if (type.includes("road") || item.address?.road) return 16;
  if (type.includes("hospital") || type.includes("clinic")) return 15;
  if (
    item.address?.city ||
    item.address?.town ||
    item.address?.village ||
    item.address?.municipality
  ) {
    return 13;
  }
  return 12;
}

function labelForResult(item: NominatimItem): string {
  const a = item.address;
  if (!a) return item.display_name.split(",")[0] ?? item.display_name;

  if (a.road) {
    const city = a.city || a.town || a.village || a.municipality || "";
    return city ? `${a.road}, ${city}` : a.road;
  }
  if (a.postcode && (a.city || a.town || a.village || a.municipality)) {
    return `${a.postcode} · ${a.city || a.town || a.village || a.municipality}`;
  }
  return a.city || a.town || a.village || a.municipality || item.display_name.split(",")[0];
}

/**
 * Geocoding con Nominatim (OpenStreetMap).
 * Limitado a España. Respeta rate-limit (~1 req/s) con debounce en la UI.
 */
export async function geocodeEspana(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding falló (${res.status})`);
  }

  const data = (await res.json()) as NominatimItem[];

  return data.map((item) => ({
    id: `geo-${item.place_id}`,
    label: labelForResult(item),
    detail: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    zoom: zoomForResult(item),
    source: "geocode" as const,
  }));
}
