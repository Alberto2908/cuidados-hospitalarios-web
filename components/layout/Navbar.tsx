"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Menu,
  X,
  ChevronDown,
  Megaphone,
  Search,
  History,
  LayoutDashboard,
  Users,
  UserCheck,
  User,
  KeyRound,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth/AuthContext";

/* ─── tipos de enlace de nav ─────────────────────────────────────── */
interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_LINKS: Record<UserRole, NavLink[]> = {
  PACIENTE: [
    { label: "Poner anuncio",   href: "/paciente/anuncio/nuevo", icon: <Megaphone className="h-4 w-4" /> },
    { label: "Buscar cuidador", href: "/paciente/buscar",        icon: <Search     className="h-4 w-4" /> },
    { label: "Ver historial",   href: "/paciente/historial",     icon: <History    className="h-4 w-4" /> },
  ],
  CUIDADOR: [
    { label: "Buscar anuncio", href: "/cuidador/buscar",    icon: <Search  className="h-4 w-4" /> },
    { label: "Ver historial",  href: "/cuidador/historial", icon: <History className="h-4 w-4" /> },
  ],
  ADMIN: [
    { label: "Gestionar anuncios",  href: "/admin/anuncios",  icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Gestionar cuidadores",href: "/admin/cuidadores",icon: <UserCheck       className="h-4 w-4" /> },
    { label: "Gestionar pacientes", href: "/admin/pacientes", icon: <Users           className="h-4 w-4" /> },
  ],
};

const ROLE_BADGE: Record<UserRole, { label: string; classes: string }> = {
  PACIENTE: { label: "Paciente", classes: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  CUIDADOR: { label: "Cuidador", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  ADMIN:    { label: "Admin",    classes: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
};

/* ─── componente principal ───────────────────────────────────────── */
export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
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

  const links = user ? NAV_LINKS[user.role] : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-muted/30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <HeartPulse className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:block text-base">Cuidados Hospitalarios</span>
        </Link>

        {/* ── Nav links desktop (solo si está autenticado) ── */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* ── Zona derecha ── */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            /* ── User menu dropdown ── */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                {/* Avatar inicial */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {user.nombre[0]}{user.apellido[0]}
                </div>
                <span className="hidden sm:block font-medium text-foreground">
                  {user.nombre} {user.apellido}
                </span>
                {/* Badge de rol */}
                <span className={`hidden sm:block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[user.role].classes}`}>
                  {ROLE_BADGE[user.role].label}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                  {/* Cabecera del dropdown */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{user.nombre} {user.apellido}</p>
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
                    {user.role === "ADMIN" && (
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Acceder
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* ── Botón hamburguesa (móvil) ── */}
          {isAuthenticated && (
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
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
        <div className="md:hidden border-t border-border bg-muted/30">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {/* Perfil en móvil */}
            <div className="mt-2 border-t border-border pt-2 flex flex-col gap-1">
              <Link href="/perfil" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <User className="h-4 w-4" /> Datos personales
              </Link>
              <Link href="/perfil/contrasena" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <KeyRound className="h-4 w-4" /> Cambiar contraseña
              </Link>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
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
