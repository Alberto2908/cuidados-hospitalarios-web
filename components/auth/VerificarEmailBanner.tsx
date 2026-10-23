"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { MailWarning } from "lucide-react";
import { debeVerificarEmail } from "@/components/auth/VerificarEmailGuard";

// Aviso para quien aún no ha verificado su email. Con VerificarEmailGuard, casi cualquier
// ruta lleva a la pantalla de verificación; este aviso solo se ve en las páginas que quedan
// accesibles sin verificar (las legales). No se muestra en la propia pantalla de verificación.
export default function VerificarEmailBanner() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!debeVerificarEmail(user) || pathname === "/verificar-email") return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
      <MailWarning className="h-4 w-4 shrink-0" />
      <span>Antes de usar la app, tienes que verificar tu email.</span>
      <Link href="/verificar-email" className="font-medium underline underline-offset-2">
        Verificar ahora
      </Link>
    </div>
  );
}
