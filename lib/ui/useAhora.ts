"use client";

import { useEffect, useState } from "react";

/**
 * Instante actual (ms) que se refresca cada `cadaMs` (30 s por defecto): para que las
 * pantallas que dependen de la hora (cuidado en curso, limite de retirada...) cambien
 * solas sin recargar.
 */
export function useAhora(cadaMs = 30_000): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);
  return ahora;
}
