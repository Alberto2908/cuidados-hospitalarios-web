export interface FranjaHoraria {
  fecha: string; // yyyy-MM-dd
  horaDesde: string; // HH:mm
  horaHasta: string; // HH:mm (≤ desde = cruza medianoche)
  diaEntero?: boolean;
}

export interface Anuncio {
  id: string;
  hospitalId: string;
  titulo: string;
  descripcion: string;
  pacienteNombre: string;
  necesidades: string[];
  /** Legado para filtros de listado; preferir franjas cuando existan. */
  turno: "mañana" | "tarde" | "noche" | "flexible";
  fechaPublicacion: string;
  estado: "activo" | "cubierto" | "cerrado";
  franjas?: FranjaHoraria[];
  /** Datos sensibles: solo tras aceptación del cuidador. */
  planta?: string;
  habitacion?: string;
  cama?: string;
}

export const MOCK_ANUNCIOS: Anuncio[] = [
  {
    id: "a1",
    hospitalId: "h1",
    titulo: "Cuidado nocturno para persona mayor",
    descripcion: "Necesito un cuidador para mi madre de 78 años ingresada en planta de geriatría.",
    pacienteNombre: "María García",
    necesidades: ["Acompañamiento", "Higiene personal", "Administración de medicación"],
    turno: "noche",
    fechaPublicacion: "2024-06-01",
    estado: "activo",
  },
  {
    id: "a2",
    hospitalId: "h1",
    titulo: "Acompañamiento diurno post-operatorio",
    descripcion: "Padre de 65 años en recuperación tras operación de cadera, necesita compañía y asistencia.",
    pacienteNombre: "Carlos Sánchez",
    necesidades: ["Acompañamiento", "Movilidad", "Fisioterapia básica"],
    turno: "mañana",
    fechaPublicacion: "2024-06-03",
    estado: "activo",
  },
  {
    id: "a3",
    hospitalId: "h2",
    titulo: "Cuidado intensivo para paciente oncológico",
    descripcion: "Familiar en tratamiento de quimioterapia necesita cuidador con experiencia en oncología.",
    pacienteNombre: "Laura Fernández",
    necesidades: ["Acompañamiento", "Higiene personal", "Apoyo emocional"],
    turno: "flexible",
    fechaPublicacion: "2024-06-02",
    estado: "activo",
  },
  {
    id: "a4",
    hospitalId: "h2",
    titulo: "Cuidador para persona con Alzheimer",
    descripcion: "Madre con Alzheimer moderado ingresada en neurología, requiere vigilancia constante.",
    pacienteNombre: "José Martínez",
    necesidades: ["Vigilancia", "Acompañamiento", "Estimulación cognitiva"],
    turno: "tarde",
    fechaPublicacion: "2024-06-04",
    estado: "activo",
  },
  {
    id: "a5",
    hospitalId: "h2",
    titulo: "Apoyo en rehabilitación",
    descripcion: "Padre en unidad de rehabilitación tras ACV, busco cuidador con experiencia.",
    pacienteNombre: "Elena Díaz",
    necesidades: ["Rehabilitación", "Movilidad", "Comunicación"],
    turno: "mañana",
    fechaPublicacion: "2024-06-05",
    estado: "activo",
  },
  {
    id: "a6",
    hospitalId: "h3",
    titulo: "Cuidado pediátrico especializado",
    descripcion: "Hijo de 8 años hospitalizado, necesitamos apoyo durante las horas de visita y más.",
    pacienteNombre: "Fernando Moreno",
    necesidades: ["Acompañamiento", "Actividades lúdicas", "Apoyo emocional"],
    turno: "tarde",
    fechaPublicacion: "2024-06-01",
    estado: "activo",
  },
  {
    id: "a7",
    hospitalId: "h4",
    titulo: "Cuidador nocturno urgente",
    descripcion: "Abuela de 82 años ingresada en urgencias, necesitamos cobertura inmediata.",
    pacienteNombre: "Ana López",
    necesidades: ["Acompañamiento", "Higiene personal"],
    turno: "noche",
    fechaPublicacion: "2024-06-06",
    estado: "activo",
  },
  {
    id: "a8",
    hospitalId: "h5",
    titulo: "Apoyo post-parto",
    descripcion: "Busco cuidadora con experiencia en apoyo post-parto para mi pareja.",
    pacienteNombre: "Miguel Ruiz",
    necesidades: ["Apoyo post-parto", "Lactancia", "Acompañamiento"],
    turno: "flexible",
    fechaPublicacion: "2024-06-02",
    estado: "activo",
  },
  {
    id: "a9",
    hospitalId: "h6",
    titulo: "Cuidado para enfermedad crónica",
    descripcion: "Familiar con EPOC avanzada necesita cuidador con conocimientos de oxigenoterapia.",
    pacienteNombre: "María García",
    necesidades: ["Oxigenoterapia", "Higiene personal", "Medicación"],
    turno: "mañana",
    fechaPublicacion: "2024-06-03",
    estado: "activo",
  },
  {
    id: "a10",
    hospitalId: "h7",
    titulo: "Acompañamiento en UCI",
    descripcion: "Padre en UCI, necesito cuidador que pueda estar en la zona de espera y gestionar comunicaciones.",
    pacienteNombre: "Carlos Sánchez",
    necesidades: ["Acompañamiento", "Gestión familiar", "Apoyo emocional"],
    turno: "flexible",
    fechaPublicacion: "2024-06-04",
    estado: "activo",
  },
  {
    id: "a11",
    hospitalId: "h8",
    titulo: "Cuidado geriatría turno tarde",
    descripcion: "Madre de 85 años en planta de geriatría, necesitamos cobertura por las tardes.",
    pacienteNombre: "Laura Fernández",
    necesidades: ["Acompañamiento", "Alimentación asistida", "Higiene"],
    turno: "tarde",
    fechaPublicacion: "2024-06-05",
    estado: "activo",
  },
  {
    id: "a12",
    hospitalId: "h9",
    titulo: "Cuidador para paciente con movilidad reducida",
    descripcion: "Abuelo de 75 años con fractura de fémur, necesita ayuda con movilidad y fisioterapia.",
    pacienteNombre: "Elena Díaz",
    necesidades: ["Movilidad", "Fisioterapia básica", "Acompañamiento"],
    turno: "mañana",
    fechaPublicacion: "2024-06-01",
    estado: "activo",
  },
];
