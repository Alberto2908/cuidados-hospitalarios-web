"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-container flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Algo no ha ido bien</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        No hemos podido cargar esta página. Inténtalo de nuevo; si el problema continúa, vuelve más tarde.
      </p>
      <Button onClick={reset} className="mt-6">
        Reintentar
      </Button>
    </div>
  );
}
