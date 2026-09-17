"use client";

import Link from "next/link";
import { useAuth, UserRole } from "@/lib/auth/AuthContext";
import { HeartPulse } from "lucide-react";

const ROLE_TEXT: Record<UserRole, { color: string; label: string }> = {
  USUARIO: { color: "text-sky-600 dark:text-sky-400", label: "Paciente" },
  CUIDADOR: { color: "text-emerald-600 dark:text-emerald-400", label: "Cuidador" },
  ADMIN: { color: "text-violet-600 dark:text-violet-400", label: "Admin" },
};

export default function InicioPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-2xl text-center">

        {/* Icono y título */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-md">
          <HeartPulse className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Cuidados Hospitalarios
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Conectamos familias con cuidadores profesionales de confianza.
        </p>

        <div className="mt-10">
          {isLoading ? null : !isAuthenticated ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/registro"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
              <p className="text-sm text-muted-foreground">Has iniciado sesión como</p>
              <p className={`mt-1 text-2xl font-bold ${ROLE_TEXT[user!.rol].color}`}>
                {user!.nombre} {user!.apellidos}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{user!.email}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Rol: {ROLE_TEXT[user!.rol].label}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Usa el navbar de arriba para navegar por las opciones de tu rol.
              </p>
              <button
                onClick={logout}
                className="mt-6 rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
