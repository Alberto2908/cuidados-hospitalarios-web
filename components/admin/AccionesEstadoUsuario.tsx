"use client";

import { useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { darDeBajaUsuario, reactivarUsuario, suspenderUsuario, type EstadoUsuario } from "@/lib/api/admin";

interface AccionesEstadoUsuarioProps {
  usuarioId: string;
  estado: EstadoUsuario;
  /** Queries a invalidar tras cualquier accion (el listado y el propio detalle). */
  queryKeysAInvalidar: QueryKey[];
}

type AccionPendiente = "suspender" | "baja";

const CONFIRMACIONES: Record<AccionPendiente, { titulo: string; descripcion: string; textoConfirmar: string }> = {
  suspender: {
    titulo: "¿Suspender esta cuenta?",
    descripcion: "No podrá iniciar sesión hasta que la reactives, y sus sesiones abiertas se cierran al momento.",
    textoConfirmar: "Suspender cuenta",
  },
  baja: {
    titulo: "¿Dar de baja esta cuenta?",
    descripcion:
      "No es reversible desde aquí: se cierran sus sesiones y se programará el borrado de sus datos identificativos.",
    textoConfirmar: "Dar de baja",
  },
};

export default function AccionesEstadoUsuario({ usuarioId, estado, queryKeysAInvalidar }: AccionesEstadoUsuarioProps) {
  const queryClient = useQueryClient();
  const [pendiente, setPendiente] = useState<AccionPendiente | null>(null);

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
          onClick={() => setPendiente("suspender")}
        >
          Suspender cuenta
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={bajaMutation.isPending}
        onClick={() => setPendiente("baja")}
      >
        Dar de baja
      </Button>
      {pendiente && (
        <ConfirmDialog
          open
          onOpenChange={(abierto) => !abierto && setPendiente(null)}
          {...CONFIRMACIONES[pendiente]}
          confirmando={pendiente === "suspender" ? suspenderMutation.isPending : bajaMutation.isPending}
          onConfirmar={() => {
            (pendiente === "suspender" ? suspenderMutation : bajaMutation).mutate();
            setPendiente(null);
          }}
        />
      )}
    </div>
  );
}
