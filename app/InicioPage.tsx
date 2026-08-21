"use client";

import { useAuth, UserRole } from "@/lib/auth/AuthContext";
import { HeartPulse, UserRound, ShieldCheck, Stethoscope } from "lucide-react";

const roles: { role: UserRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    role: "PACIENTE",
    label: "Paciente",
    desc: "Publica anuncios y encuentra al cuidador ideal para ti o tu familiar.",
    icon: <UserRound className="h-7 w-7" />,
    color: "border-sky-200 hover:border-sky-400 hover:bg-sky-50 dark:border-sky-800 dark:hover:border-sky-500 dark:hover:bg-sky-950/30",
  },
  {
    role: "CUIDADOR",
    label: "Cuidador",
    desc: "Explora anuncios de familias que buscan un cuidador profesional.",
    icon: <Stethoscope className="h-7 w-7" />,
    color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30",
  },
  {
    role: "ADMIN",
    label: "Administrador",
    desc: "Gestiona toda la plataforma: anuncios, cuidadores y pacientes.",
    icon: <ShieldCheck className="h-7 w-7" />,
    color: "border-violet-200 hover:border-violet-400 hover:bg-violet-50 dark:border-violet-800 dark:hover:border-violet-500 dark:hover:bg-violet-950/30",
  },
];

const ROLE_TEXT: Record<UserRole, { color: string }> = {
  PACIENTE: { color: "text-sky-600 dark:text-sky-400" },
  CUIDADOR: { color: "text-emerald-600 dark:text-emerald-400" },
  ADMIN:    { color: "text-violet-600 dark:text-violet-400" },
};

export default function InicioPage() {
  const { user, login, logout, isAuthenticated } = useAuth();

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
          {!isAuthenticated ? (
            <>
              <p className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                — Demo: selecciona un rol para probar el navbar —
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {roles.map(({ role, label, desc, icon, color }) => (
                  <button
                    key={role}
                    onClick={() => login(role)}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 bg-background p-6 text-center transition-all cursor-pointer ${color}`}
                  >
                    <div className="text-muted-foreground">{icon}</div>
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{desc}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
              <p className="text-sm text-muted-foreground">Has iniciado sesión como</p>
              <p className={`mt-1 text-2xl font-bold ${ROLE_TEXT[user!.role].color}`}>
                {user!.nombre} {user!.apellido}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{user!.email}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Rol: {user!.role}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Usa el navbar de arriba para navegar por las opciones de tu rol.
              </p>
              <button
                onClick={logout}
                className="mt-6 rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Cambiar de rol
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
