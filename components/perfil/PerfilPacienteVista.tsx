"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { fetchPacientePerfil } from "@/lib/api/pacientes";
import { formatearAntiguedad } from "@/lib/fecha";
import ListaCompletados from "@/components/perfil/ListaCompletados";


/**
 * Perfil público de un paciente/familiar. Lo usan tanto la ficha que abre
 * otro usuario (/pacientes/[id]) como "Mi perfil" (/mi-perfil). Solo datos
 * de actividad: nunca contacto, documento ni la localización en el hospital.
 */
export default function PerfilPacienteVista({ pacienteId, accion }: { pacienteId: string; accion?: ReactNode }) {
  const { data: paciente, isLoading, isError } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: () => fetchPacientePerfil(pacienteId),
    retry: false,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando perfil…</p>;
  }

  if (isError || !paciente) {
    return (
      <div className="rounded-2xl bg-surface-sunken py-16 text-center text-sm text-muted-foreground shadow-inset-soft">
        No se ha encontrado este perfil.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground">
          {paciente.nombre[0]}
          {paciente.apellidos[0]}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
            {paciente.nombre} {paciente.apellidos}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {paciente.identidadVerificada && (
              <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verificado
              </span>
            )}
          </div>
        </div>
        {accion && <div className="ml-auto shrink-0">{accion}</div>}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl bg-card shadow-float">
        <div className="p-3.5 text-center">
          <p className="text-lg font-semibold text-foreground">{paciente.anunciosPublicados}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">anuncios publicados</p>
        </div>
        <div className="p-3.5 text-center">
          <p className="text-lg font-semibold text-foreground">{paciente.anunciosCompletados}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">completados</p>
        </div>
        <div className="p-3.5 text-center">
          <p className="text-lg font-semibold text-foreground">{formatearAntiguedad(paciente.miembroDesde)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">en la app</p>
        </div>
      </div>
      <ListaCompletados
        titulo="Anuncios completados"
        total={paciente.anunciosCompletados}
        items={paciente.ultimosAnunciosCompletados}
        vacio="Todavía no ha completado ningún anuncio."
        enCuadricula
      />
    </div>
  );
}
