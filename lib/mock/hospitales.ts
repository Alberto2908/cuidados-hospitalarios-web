export interface Hospital {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  lat: number;
  lng: number;
}

export const MOCK_HOSPITALES: Hospital[] = [
  {
    id: "h1",
    nombre: "Hospital Universitario La Paz",
    direccion: "Paseo de la Castellana, 261",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28046",
    lat: 40.4794,
    lng: -3.6918,
  },
  {
    id: "h2",
    nombre: "Hospital General Universitario Gregorio Marañón",
    direccion: "Calle del Doctor Esquerdo, 46",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28007",
    lat: 40.4072,
    lng: -3.6865,
  },
  {
    id: "h3",
    nombre: "Hospital Universitario 12 de Octubre",
    direccion: "Av. de Córdoba, s/n",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28041",
    lat: 40.3468,
    lng: -3.7016,
  },
  {
    id: "h4",
    nombre: "Hospital Universitario Ramón y Cajal",
    direccion: "Ctra. de Colmenar Viejo, km 9.1",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28034",
    lat: 40.4874,
    lng: -3.6649,
  },
  {
    id: "h5",
    nombre: "Hospital Clínico San Carlos",
    direccion: "Calle del Prof. Martín Lagos, s/n",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28040",
    lat: 40.4406,
    lng: -3.7195,
  },
  {
    id: "h6",
    nombre: "Hospital Universitario de La Princesa",
    direccion: "Calle de Diego de León, 62",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28006",
    lat: 40.4368,
    lng: -3.6778,
  },
  {
    id: "h7",
    nombre: "Hospital Universitario Puerta de Hierro",
    direccion: "Calle Joaquín Rodrigo, 2",
    ciudad: "Majadahonda",
    provincia: "Madrid",
    codigoPostal: "28222",
    lat: 40.4397,
    lng: -3.8732,
  },
  {
    id: "h8",
    nombre: "Hospital Universitario Fundación Jiménez Díaz",
    direccion: "Av. de los Reyes Católicos, 2",
    ciudad: "Madrid",
    provincia: "Madrid",
    codigoPostal: "28040",
    lat: 40.4345,
    lng: -3.7386,
  },
  {
    id: "h9",
    nombre: "Hospital Universitario Infanta Sofía",
    direccion: "Paseo de Europa, 34",
    ciudad: "San Sebastián de los Reyes",
    provincia: "Madrid",
    codigoPostal: "28702",
    lat: 40.5476,
    lng: -3.6341,
  },
  {
    id: "h10",
    nombre: "Hospital Universitario Severo Ochoa",
    direccion: "Av. de Orellana, s/n",
    ciudad: "Leganés",
    provincia: "Madrid",
    codigoPostal: "28911",
    lat: 40.3271,
    lng: -3.7638,
  },
  {
    id: "h11",
    nombre: "Hospital Clínic de Barcelona",
    direccion: "Carrer de Villarroel, 170",
    ciudad: "Barcelona",
    provincia: "Barcelona",
    codigoPostal: "08036",
    lat: 41.3888,
    lng: 2.1519,
  },
  {
    id: "h12",
    nombre: "Hospital de la Santa Creu i Sant Pau",
    direccion: "Carrer de Sant Quintí, 89",
    ciudad: "Barcelona",
    provincia: "Barcelona",
    codigoPostal: "08041",
    lat: 41.4127,
    lng: 2.1744,
  },
  {
    id: "h13",
    nombre: "Hospital Universitari Vall d'Hebron",
    direccion: "Passeig de la Vall d'Hebron, 119-129",
    ciudad: "Barcelona",
    provincia: "Barcelona",
    codigoPostal: "08035",
    lat: 41.4279,
    lng: 2.1426,
  },
  {
    id: "h14",
    nombre: "Hospital Universitari i Politècnic La Fe",
    direccion: "Avinguda de Fernando Abril Martorell, 106",
    ciudad: "Valencia",
    provincia: "Valencia",
    codigoPostal: "46026",
    lat: 39.4442,
    lng: -0.3765,
  },
  {
    id: "h15",
    nombre: "Hospital Clínico Universitario de Valencia",
    direccion: "Avenida de Blasco Ibáñez, 17",
    ciudad: "Valencia",
    provincia: "Valencia",
    codigoPostal: "46010",
    lat: 39.4796,
    lng: -0.3415,
  },
];

/** Provincias presentes en el catálogo (orden alfabético). */
export function listProvincias(hospitals: Hospital[] = MOCK_HOSPITALES): string[] {
  return Array.from(new Set(hospitals.map((h) => h.provincia))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

export function hospitalesByProvincia(
  provincia: string,
  hospitals: Hospital[] = MOCK_HOSPITALES,
): Hospital[] {
  if (!provincia) return [];
  return hospitals.filter((h) => h.provincia === provincia);
}

/** Texto indexable para búsqueda local */
export function hospitalSearchText(h: Hospital): string {
  return `${h.nombre} ${h.direccion} ${h.ciudad} ${h.provincia} ${h.codigoPostal}`.toLowerCase();
}

export function matchHospitalesByQuery(query: string): Hospital[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_HOSPITALES.filter((h) => hospitalSearchText(h).includes(q));
}
