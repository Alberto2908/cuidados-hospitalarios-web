"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cuidadorCompleto, itemsCompletitud, porcentajeCompletitud } from "@/lib/cuidador/completitud";
import SelectorBuscador from "@/components/cuidador/SelectorBuscador";

/**
 * Envuelve las pantallas exclusivas del cuidador (buscar anuncios, mis
 * inscripciones): mientras el alta no esté al 100 % muestra qué falta en lugar
 * del contenido.
 */
export default function RequiereCuidadorCompleto({
  children,
  conSelectorBuscador = false,
}: {
  children: ReactNode;
  conSelectorBuscador?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <div className="page-container py-8 text-sm text-muted-foreground">Cargando…</div>;
  }
  if (cuidadorCompleto(user)) return <>{children}</>;

  const pendientes = itemsCompletitud(user).filter((i) => !i.hecho);

  return (
    <div className="page-container py-8">
      {conSelectorBuscador && (
        <div className="mb-5 flex justify-end">
          <SelectorBuscador activo="anuncios" />
        </div>
      )}
      <div className="mx-auto max-w-lg rounded-2xl bg-card p-8 text-center shadow-float">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Función bloqueada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta sección se desbloquea cuando completes el 100 % del proceso para ser cuidador. Llevas un{" "}
          {porcentajeCompletitud(user)} %.
        </p>
        {pendientes.length > 0 && (
          <ul className="mt-4 space-y-1 text-left text-sm text-muted-foreground">
            {pendientes.map((p) => (
              <li
                key={p.label}
                className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Pendiente: {p.label}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex justify-center">
          <Link
            href="/perfil"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90"
          >
            Completar mi perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
