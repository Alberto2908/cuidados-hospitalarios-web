export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  anunciosActivos: number;
  estado: "activo" | "inactivo" | "suspendido";
}

export interface Cuidador {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  experienciaAnios: number;
  especialidad: string;
  valoracion: number;
  estado: "activo" | "inactivo" | "suspendido";
  hospitalesDisponibles: string[];
}

export const MOCK_PACIENTES: Paciente[] = [
  { id: "p1", nombre: "María",    apellido: "García",    email: "maria.garcia@email.com",    telefono: "+34 612 345 678", fechaRegistro: "2024-01-15", anunciosActivos: 2, estado: "activo" },
  { id: "p2", nombre: "José",     apellido: "Martínez",  email: "jose.martinez@email.com",   telefono: "+34 623 456 789", fechaRegistro: "2024-02-20", anunciosActivos: 1, estado: "activo" },
  { id: "p3", nombre: "Ana",      apellido: "López",     email: "ana.lopez@email.com",       telefono: "+34 634 567 890", fechaRegistro: "2024-03-05", anunciosActivos: 0, estado: "inactivo" },
  { id: "p4", nombre: "Carlos",   apellido: "Sánchez",   email: "carlos.sanchez@email.com",  telefono: "+34 645 678 901", fechaRegistro: "2024-03-18", anunciosActivos: 3, estado: "activo" },
  { id: "p5", nombre: "Laura",    apellido: "Fernández", email: "laura.fernandez@email.com", telefono: "+34 656 789 012", fechaRegistro: "2024-04-02", anunciosActivos: 1, estado: "activo" },
  { id: "p6", nombre: "Miguel",   apellido: "Ruiz",      email: "miguel.ruiz@email.com",     telefono: "+34 667 890 123", fechaRegistro: "2024-04-15", anunciosActivos: 0, estado: "suspendido" },
  { id: "p7", nombre: "Elena",    apellido: "Díaz",      email: "elena.diaz@email.com",      telefono: "+34 678 901 234", fechaRegistro: "2024-05-01", anunciosActivos: 2, estado: "activo" },
  { id: "p8", nombre: "Fernando", apellido: "Moreno",    email: "fernando.moreno@email.com", telefono: "+34 689 012 345", fechaRegistro: "2024-05-20", anunciosActivos: 1, estado: "activo" },
];

export const MOCK_CUIDADORES: Cuidador[] = [
  { id: "c1", nombre: "Sofía",    apellido: "Torres",    email: "sofia.torres@email.com",    telefono: "+34 611 111 111", fechaRegistro: "2024-01-10", experienciaAnios: 5, especialidad: "Personas mayores",      valoracion: 4.9, estado: "activo",     hospitalesDisponibles: ["h1", "h4", "h6"] },
  { id: "c2", nombre: "Pablo",    apellido: "Ramírez",   email: "pablo.ramirez@email.com",   telefono: "+34 622 222 222", fechaRegistro: "2024-02-14", experienciaAnios: 3, especialidad: "Enfermedades crónicas", valoracion: 4.7, estado: "activo",     hospitalesDisponibles: ["h2", "h3", "h5"] },
  { id: "c3", nombre: "Lucía",    apellido: "Herrera",   email: "lucia.herrera@email.com",   telefono: "+34 633 333 333", fechaRegistro: "2024-02-28", experienciaAnios: 8, especialidad: "Rehabilitación",        valoracion: 4.8, estado: "activo",     hospitalesDisponibles: ["h1", "h2", "h7", "h8"] },
  { id: "c4", nombre: "Diego",    apellido: "Jiménez",   email: "diego.jimenez@email.com",   telefono: "+34 644 444 444", fechaRegistro: "2024-03-12", experienciaAnios: 2, especialidad: "Cuidados paliativos",   valoracion: 4.5, estado: "activo",     hospitalesDisponibles: ["h3", "h9", "h10"] },
  { id: "c5", nombre: "Carmen",   apellido: "Álvarez",   email: "carmen.alvarez@email.com",  telefono: "+34 655 555 555", fechaRegistro: "2024-03-25", experienciaAnios: 6, especialidad: "Personas mayores",      valoracion: 4.6, estado: "inactivo",   hospitalesDisponibles: ["h2", "h6"] },
  { id: "c6", nombre: "Andrés",   apellido: "Romero",    email: "andres.romero@email.com",   telefono: "+34 666 666 666", fechaRegistro: "2024-04-08", experienciaAnios: 4, especialidad: "Salud mental",          valoracion: 4.4, estado: "suspendido", hospitalesDisponibles: ["h5", "h8"] },
  { id: "c7", nombre: "Isabel",   apellido: "Navarro",   email: "isabel.navarro@email.com",  telefono: "+34 677 777 777", fechaRegistro: "2024-04-22", experienciaAnios: 7, especialidad: "Enfermedades crónicas", valoracion: 4.9, estado: "activo",     hospitalesDisponibles: ["h1", "h2", "h4", "h6", "h9"] },
];
