"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { AlertTriangle } from "lucide-react";

export default function EstadoCuentaBanner() {
  const { user } = useAuth();

  if (user?.estado !== "suspendido") return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Tu cuenta está suspendida. Contacta con soporte para más información.</span>
    </div>
  );
}
