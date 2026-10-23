"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { aprobarVerificacion, rechazarVerificacion } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

// Aprobar/rechazar una verificación, compartido por la lista y por la modal de
// revisión. Ambas acciones sacan la solicitud de la cola: se refrescan la
// lista y la burbuja con el número de pendientes del menú.
export function useAccionesVerificacion(alTerminar?: () => void) {
  const queryClient = useQueryClient();

  function refrescar() {
    queryClient.invalidateQueries({ queryKey: ["admin", "verificaciones"] });
  }

  function alFallar(err: unknown) {
    const mensaje = err instanceof ApiError ? err.message : "No se ha podido completar la acción.";
    sileo.error({ title: "No se ha podido completar", description: mensaje });
  }

  const aprobar = useMutation({
    mutationFn: (id: string) => aprobarVerificacion(id),
    onSuccess: () => {
      refrescar();
      sileo.success({ title: "Identidad verificada", description: "Las imágenes se han archivado." });
      alTerminar?.();
    },
    onError: alFallar,
  });

  const rechazar = useMutation({
    mutationFn: (id: string) => rechazarVerificacion(id),
    onSuccess: () => {
      refrescar();
      sileo.success({ title: "Solicitud rechazada", description: "Las imágenes se han eliminado." });
      alTerminar?.();
    },
    onError: alFallar,
  });

  return { aprobar, rechazar, ocupado: aprobar.isPending || rechazar.isPending };
}
