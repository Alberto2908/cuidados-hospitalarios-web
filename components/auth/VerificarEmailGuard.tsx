"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuthUser } from "@/lib/auth/AuthContext";

// Rutas que se pueden ver sin haber verificado el email: la propia verificación y las páginas legales.
const RUTAS_LIBRES = ["/verificar-email", "/legal"];

/** Sesión iniciada con el email sin verificar (y la cuenta no dada de baja). */
export function debeVerificarEmail(user: AuthUser | null): user is AuthUser {
  return !!user && !user.emailVerificado && user.estado !== "baja";
}

// Mientras el email no esté verificado, cualquier ruta lleva a la pantalla de verificación
// (el servidor ya bloquea las acciones con consecuencias; esto evita pasearse por la app sin verificar).
export default function VerificarEmailGuard() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const libre = RUTAS_LIBRES.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));

  useEffect(() => {
    if (!isLoading && debeVerificarEmail(user) && !libre) {
      router.replace("/verificar-email");
    }
  }, [isLoading, user, libre, router]);

  return null;
}
