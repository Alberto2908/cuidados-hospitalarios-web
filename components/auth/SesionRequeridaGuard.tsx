"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

// Mismas rutas que protege proxy.ts.
const PREFIJOS_PROTEGIDOS = ["/paciente", "/cuidador", "/admin"];

// proxy.ts deja pasar un access token caducado (la web puede renovar la sesión con el refresh token), así
// que una sesión que de verdad ya no existe (refresh caducado o revocado, cuenta suspendida o de baja)
// entra en la página y verías un listado vacío en vez de la pantalla de login. Esto cierra ese hueco: cuando
// la carga de la sesión termina sin usuario, se manda a /login.
export default function SesionRequeridaGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const protegida = PREFIJOS_PROTEGIDOS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && protegida) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, protegida, router]);

  return null;
}
