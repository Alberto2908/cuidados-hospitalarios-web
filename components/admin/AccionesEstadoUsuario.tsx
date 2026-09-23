"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { darDeBajaUsuario, reactivarUsuario, suspenderUsuario, type EstadoUsuario } from "@/lib/api/admin";

interface AccionesEstadoUsuarioProps {
  usuarioId: string;
  estado: EstadoUsuario;
  /** Queries a invalidar tras cualquier accion (el listado y el propio detalle). */
  queryKeysAInvalidar: QueryKey[];
}

export default function AccionesEstadoUsuario({ usuarioId, estado, queryKeysAInvalidar }: AccionesEstadoUsuarioProps) {
  const queryClient = useQueryClient();

  function invalidarTodo() {
    queryKeysAInvalidar.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
  }

  const suspenderMutation = useMutation({
    mutationFn: () => suspenderUsuario(usuarioId),
    onSuccess: () => {
      sileo.success({ title: "Cuenta suspendida" });
      invalidarTodo();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo suspender", description: error.message }),
  });

  const reactivarMutation = useMutation({
    mutationFn: () => reactivarUsuario(usuarioId),
    onSuccess: () => {
      sileo.success({ title: "Cuenta reactivada" });
      invalidarTodo();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo reactivar", description: error.message }),
  });

  const bajaMutation = useMutation({
    mutationFn: () => darDeBajaUsuario(usuarioId),
    onSuccess: () => {
      sileo.success({ title: "Cuenta dada de baja" });
      invalidarTodo();
    },
    onError: (error: Error) => sileo.error({ title: "No se pudo dar de baja", description: error.message }),
  });

  if (estado === "baja") {
    return <p className="text-sm text-muted-foreground">Esta cuenta está de baja.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado === "suspendido" ? (
        <Button type="button" size="sm" disabled={reactivarMutation.isPending} onClick={() => reactivarMutation.mutate()}>
          Reactivar cuenta
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={suspenderMutation.isPending}
          onClick={() => {
            if (confirm("¿Seguro que quieres suspender esta cuenta? No podrá iniciar sesión hasta que la reactives.")) {
              suspenderMutation.mutate();
            }
          }}
        >
          Suspender cuenta
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={bajaMutation.isPending}
        onClick={() => {
          if (
            confirm(
              "¿Seguro que quieres dar de baja esta cuenta? No es reversible desde aquí: se programará el borrado de sus datos identificativos.",
            )
          ) {
            bajaMutation.mutate();
          }
        }}
      >
        Dar de baja
      </Button>
    </div>
  );
}
