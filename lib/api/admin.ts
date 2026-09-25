import { apiFetch } from "@/lib/api/client";
import type { EstadoAnuncio } from "@/lib/api/anuncios";
import type { Postulacion } from "@/lib/api/postulaciones";
import type { Servicio } from "@/lib/api/servicios";

export type EstadoUsuario = "pendiente" | "activo" | "suspendido" | "baja";

export interface AdminPaciente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  estado: EstadoUsuario;
  creadoEn: string;
  anunciosActivos: number;
}

// Sin especialidad/experienciaAnios: no existen todavia en el modelo real
// del cuidador (ver TODO.md, "Ampliar perfil_cuidador"). tarifaHora,
// valoracionMedia y cuidadosRealizados si son datos reales.
export interface AdminCuidador {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  estado: EstadoUsuario;
  creadoEn: string;
  tarifaHora: number | null;
  /** null si todavia no tiene ningun servicio valorado. */
  valoracionMedia: number | null;
  cuidadosRealizados: number;
}

export interface AdminAnuncioResumen {
  id: string;
  titulo: string;
  estado: "activo" | "cubierto" | "cancelado";
  hospital: { nombre: string; ciudad: string };
  creadoEn: string;
}

export interface AdminPacienteDetalle extends AdminPaciente {
  identidadVerificada: boolean;
  ultimoLoginEn: string | null;
  anuncios: AdminAnuncioResumen[];
}

export interface AdminHospitalResumen {
  id: string;
  nombre: string;
  ciudad: string;
}

export interface AdminCuidadorDetalle extends AdminCuidador {
  identidadVerificada: boolean;
  ultimoLoginEn: string | null;
  hospitales: AdminHospitalResumen[];
}

export interface AdminAnuncio {
  id: string;
  titulo: string;
  estado: EstadoAnuncio;
  hospital: { nombre: string; ciudad: string };
  pacienteId: string;
  pacienteNombre: string;
  totalPostulaciones: number;
  fechaInicioPrevista: string;
  creadoEn: string;
}

export interface AdminAnuncioFranja {
  fecha: string;
  /** "HH:MM:SS", sin recortar (a diferencia de lib/api/anuncios.ts, aqui no hay transformacion previa). */
  horaDesde: string;
  horaHasta: string;
  diaEntero: boolean;
}

// El admin ve siempre planta/habitacion/cama y todas las franjas, a
// diferencia del detalle publico (lib/api/anuncios.ts) que las oculta segun
// quien mira -> se define un tipo propio en vez de reutilizar Anuncio.
export interface AdminAnuncioDetalleAnuncio {
  id: string;
  hospital: { nombre: string; ciudad: string; direccion: string };
  titulo: string;
  descripcion: string;
  pacienteNombre: string;
  estado: EstadoAnuncio;
  franjas: AdminAnuncioFranja[];
  planta: string | null;
  habitacion: string | null;
  cama: string | null;
  creadoEn: string;
}

export interface AdminAnuncioDetalle {
  anuncio: AdminAnuncioDetalleAnuncio;
  postulaciones: Postulacion[];
  servicio: Servicio | null;
}

export function fetchAdminPacientes(): Promise<AdminPaciente[]> {
  return apiFetch<AdminPaciente[]>("/api/admin/pacientes");
}

export function fetchAdminCuidadores(): Promise<AdminCuidador[]> {
  return apiFetch<AdminCuidador[]>("/api/admin/cuidadores");
}

export function fetchAdminPaciente(id: string): Promise<AdminPacienteDetalle> {
  return apiFetch<AdminPacienteDetalle>(`/api/admin/pacientes/${id}`);
}

export function fetchAdminCuidador(id: string): Promise<AdminCuidadorDetalle> {
  return apiFetch<AdminCuidadorDetalle>(`/api/admin/cuidadores/${id}`);
}

/** Bloquea el acceso; reversible con reactivarUsuario. */
export function suspenderUsuario(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/usuarios/${id}/suspender`, { method: "POST" });
}

export function reactivarUsuario(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/usuarios/${id}/reactivar`, { method: "POST" });
}

/** Baja definitiva (no reversible desde el panel): programa el borrado de datos identificativos, ver TODO.md. */
export function darDeBajaUsuario(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/usuarios/${id}/baja`, { method: "POST" });
}

export interface PaginaAdminAnuncios {
  content: AdminAnuncio[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminAnunciosResumen {
  total: number;
  activos: number;
  cubiertos: number;
  cancelados: number;
}

export interface FiltrosAdminAnuncios {
  page?: number;
  size?: number;
  estado?: EstadoAnuncio;
  /** "YYYY-MM-DD" */
  desde?: string;
  /** "YYYY-MM-DD" */
  hasta?: string;
  busqueda?: string;
}

function paramsFiltrosAnuncios(filtros: FiltrosAdminAnuncios): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(filtros.page ?? 0));
  params.set("size", String(filtros.size ?? 20));
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  if (filtros.busqueda) params.set("busqueda", filtros.busqueda);
  return params;
}

// Paginado y filtrado en el propio backend (ver AnuncioRepository.buscarParaAdmin):
// con 100k+ anuncios no se puede traer todo de golpe y filtrar en el cliente.
export function fetchAdminAnuncios(filtros: FiltrosAdminAnuncios = {}): Promise<PaginaAdminAnuncios> {
  return apiFetch<PaginaAdminAnuncios>(`/api/admin/anuncios?${paramsFiltrosAnuncios(filtros)}`);
}

/** Tarjetas resumen: respetan fecha/busqueda de filtros, pero no filtros.estado (es lo que se desglosa). */
export function fetchAdminAnunciosResumen(
  filtros: Pick<FiltrosAdminAnuncios, "desde" | "hasta" | "busqueda"> = {},
): Promise<AdminAnunciosResumen> {
  const params = new URLSearchParams();
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  if (filtros.busqueda) params.set("busqueda", filtros.busqueda);
  return apiFetch<AdminAnunciosResumen>(`/api/admin/anuncios/resumen?${params}`);
}

export function fetchAdminAnuncio(id: string): Promise<AdminAnuncioDetalle> {
  return apiFetch<AdminAnuncioDetalle>(`/api/admin/anuncios/${id}`);
}

/** Moderacion: a diferencia de cancelarAnuncio (lib/api/anuncios.ts), el admin puede cancelar cualquier anuncio activo, no solo el propio. */
export function cancelarAnuncioAdmin(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/anuncios/${id}/cancelar`, { method: "POST" });
}

export type GranularidadDashboard = "dias" | "meses" | "anios";

export interface PuntoRegistros {
  /** "2026-09-20" (dias), "2026-09" (meses) o "2026" (anios), segun la granularidad pedida. */
  etiqueta: string;
  pacientes: number;
  cuidadores: number;
  // Firma indice: LineChart es generico sobre el nombre de cada serie
  // (series[].key), y TS exige que el tipo del dato declare esa forma.
  [serieKey: string]: string | number;
}

export interface DashboardUsuarios {
  totalPacientes: number;
  totalCuidadores: number;
  /** Cuentas con sesion activa ahora mismo (refresh token vigente) -no hay presencia en tiempo real, es la aproximacion mas honesta sin construirla. */
  sesionesActivas: number;
  /** null si ningun cuidador ha fijado tarifa todavia. */
  tarifaMediaCuidadores: number | null;
  pacientesPorEstado: Partial<Record<EstadoUsuario, number>>;
  cuidadoresPorEstado: Partial<Record<EstadoUsuario, number>>;
}

export interface PuntoConteo {
  etiqueta: string;
  total: number;
  [serieKey: string]: string | number;
}

export interface DashboardAnuncios {
  total: number;
  /** Anuncios activos sin ninguna postulacion todavia. */
  sinPostulaciones: number;
  porEstado: Partial<Record<EstadoAnuncio, number>>;
}

export type EstadoPostulacionDashboard = "pendiente" | "aceptada" | "rechazada" | "retirada";

export interface DashboardPostulaciones {
  total: number;
  porEstado: Partial<Record<EstadoPostulacionDashboard, number>>;
  /** % de postulaciones resueltas (ni pendientes) que acabaron aceptadas. */
  tasaAceptacion: number;
}

export type EstadoServicioDashboard = "aceptado" | "confirmado" | "pendiente_confirmacion" | "completado" | "cancelado";

export interface DashboardServicios {
  total: number;
  porEstado: Partial<Record<EstadoServicioDashboard, number>>;
  /** Solo pagos ya procesados (estado_pago = 'procesado'); 0 mientras no exista el cobro real via Stripe. */
  importeGenerado: number;
  valoracionMedia: number | null;
}

export interface DashboardTopHospital {
  id: string;
  nombre: string;
  ciudad: string;
  totalAnuncios: number;
}

export interface Dashboard {
  usuarios: DashboardUsuarios;
  anuncios: DashboardAnuncios;
  postulaciones: DashboardPostulaciones;
  servicios: DashboardServicios;
  topHospitales: DashboardTopHospital[];
}

export function fetchAdminDashboard(): Promise<Dashboard> {
  return apiFetch<Dashboard>("/api/admin/dashboard");
}

// Series temporales aparte: cada grafica de linea del dashboard tiene su
// propio selector de dias/meses/años, independiente del resto.
export function fetchAdminDashboardRegistros(granularidad: GranularidadDashboard): Promise<PuntoRegistros[]> {
  return apiFetch<PuntoRegistros[]>(`/api/admin/dashboard/registros?granularidad=${granularidad}`);
}

export function fetchAdminDashboardAnunciosPublicados(granularidad: GranularidadDashboard): Promise<PuntoConteo[]> {
  return apiFetch<PuntoConteo[]>(`/api/admin/dashboard/anuncios-publicados?granularidad=${granularidad}`);
}
