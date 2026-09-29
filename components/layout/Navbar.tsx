"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  X,
  ChevronDown,
  Megaphone,
  Search,
  History,
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  User,
  KeyRound,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth/AuthContext";
import { misNotificacionesConteo as misNotificacionesConteoAnuncios } from "@/lib/api/anuncios";
import { misNotificacionesConteo as misNotificacionesConteoPostulaciones } from "@/lib/api/postulaciones";

// Notificaciones por rol: para USUARIO/CUIDADOR-como-paciente, postulaciones
// que esperan su respuesta en sus anuncios activos (ver backend
// AnuncioService.contarNotificacionesPendientes); para CUIDADOR, sus propias
// postulaciones donde el paciente acaba de contraofertar (ver backend
// PostulacionService.contarNotificacionesPendientes). Cada href de "mis
// anuncios/postulaciones" tiene como mucho un contador activo a la vez.
const HREF_NOTIFICACIONES_PACIENTE = "/paciente/historial";
const HREF_NOTIFICACIONES_CUIDADOR = "/cuidador/historial";

/* ─── tipos de enlace de nav ─────────────────────────────────────── */
interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_LINKS: Record<UserRole, NavLink[]> = {
  USUARIO: [
    { label: "Poner anuncio",   href: "/paciente/anuncio/nuevo", icon: <Megaphone className="h-4 w-4" /> },
    { label: "Buscar cuidador", href: "/paciente/buscar",        icon: <Search     className="h-4 w-4" /> },
    { label: "Mis anuncios",    href: "/paciente/historial",     icon: <History    className="h-4 w-4" /> },
  ],
  CUIDADOR: [
    { label: "Buscar anuncio", href: "/cuidador/buscar",    icon: <Search  className="h-4 w-4" /> },
    { label: "Mis postulaciones", href: "/cuidador/historial", icon: <History className="h-4 w-4" /> },
  ],
  ADMIN: [
    { label: "Dashboard",           href: "/admin/dashboard", icon: <BarChart3       className="h-4 w-4" /> },
    { label: "Gestionar anuncios",  href: "/admin/anuncios",  icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Gestionar cuidadores",href: "/admin/cuidadores",icon: <UserCheck       className="h-4 w-4" /> },
    { label: "Gestionar pacientes", href: "/admin/pacientes", icon: <Users           className="h-4 w-4" /> },
  ],
};

/* ─── componente principal ───────────────────────────────────────── */
export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* cierra el dropdown al hacer clic fuera */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = user ? NAV_LINKS[user.rol] : [];

  const esPaciente = user?.rol === "USUARIO";
  const esCuidador = user?.rol === "CUIDADOR";

  const { data: notificacionesAnuncios } = useQuery({
    queryKey: ["anuncios", "notificaciones-conteo"],
    queryFn: misNotificacionesConteoAnuncios,
    enabled: isAuthenticated && esPaciente,
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
  });
  const { data: notificacionesPostulaciones } = useQuery({
    queryKey: ["postulaciones", "notificaciones-conteo"],
    queryFn: misNotificacionesConteoPostulaciones,
    enabled: isAuthenticated && esCuidador,
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
  });

  const notificacionesPorHref: Record<string, number> = {
    [HREF_NOTIFICACIONES_PACIENTE]: notificacionesAnuncios?.total ?? 0,
    [HREF_NOTIFICACIONES_CUIDADOR]: notificacionesPostulaciones?.total ?? 0,
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 shadow-soft shrink-0 justify-self-start">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="hidden sm:block text-sm font-semibold text-foreground">Cuidados</span>
        </Link>

        {/* ── Nav links desktop (solo si está autenticado), centrados independientemente del ancho de logo/avatar ──
             El wrapper se renderiza siempre (aunque esté vacío) para que el grid de 3 columnas mantenga la
             columna central y la zona derecha no "herede" su hueco cuando no hay sesión. */}
        <div className="justify-self-center">
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 rounded-full bg-card p-1 shadow-soft">
              {links.map((link) => {
                const activo = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                      activo
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                    {(notificacionesPorHref[link.href] ?? 0) > 0 && (
                      <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {notificacionesPorHref[link.href]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* ── Zona derecha ── */}
        <div className="flex items-center justify-self-end gap-2">
          {isAuthenticated && user ? (
            /* ── User menu dropdown ── */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-3 shadow-soft transition-shadow hover:shadow-float"
              >
                {/* Avatar inicial */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {user.nombre[0]}{user.apellidos[0]}
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground">
                  {user.nombre} {user.apellidos}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card shadow-float">
                  {/* Cabecera del dropdown */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{user.nombre} {user.apellidos}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {/* Opciones */}
                  <div className="py-1">
                    <Link
                      href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Datos personales
                    </Link>
                    <Link
                      href="/perfil/contrasena"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      Cambiar contraseña
                    </Link>
                    {user.rol === "ADMIN" && (
                      <Link
                        href="/admin/configuracion"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Configuración
                      </Link>
                    )}
                  </div>
                  {/* Cerrar sesión */}
                  <div className="border-t border-border py-1">
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); setMobileOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-soft">
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground shadow-primary transition-colors hover:bg-primary/90"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* ── Botón hamburguesa (móvil) ── */}
          {isAuthenticated && (
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Menú móvil ── */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden px-4 pb-3">
          <nav className="flex flex-col gap-1 rounded-2xl bg-card p-3 shadow-float">
            {links.map((link) => {
              const activo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium ${
                    activo
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {(notificacionesPorHref[link.href] ?? 0) > 0 && (
                    <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {notificacionesPorHref[link.href]}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Perfil en móvil */}
            <div className="mt-2 border-t border-border pt-2 flex flex-col gap-1">
              <Link href="/perfil" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <User className="h-4 w-4" /> Datos personales
              </Link>
              <Link href="/perfil/contrasena" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <KeyRound className="h-4 w-4" /> Cambiar contraseña
              </Link>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
