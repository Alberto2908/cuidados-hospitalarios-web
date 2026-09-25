"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { fetchCuidadorDetalle } from "@/lib/api/cuidadores";
import { fetchResenasCuidador } from "@/lib/api/resenas";
import { formatearAntiguedad, formatearFecha } from "@/lib/fecha";
import { Estrellas } from "@/components/ui/estrellas";
import { Button } from "@/components/ui/button";
import ModalResenas from "@/components/cuidador/ModalResenas";

// especialidad todavia no existe en el modelo real de cuidador (ver
// TODO.md, "Ampliar perfil_cuidador") -> mismo valor de relleno que ya
// usaba la tarjeta del buscador. antiguedad, cuidadosRealizados y la
// valoracion (calculada a partir de las resenas reales, ver mas abajo) SI
// son datos reales.
const DEFAULT_ESPECIALIDAD = "Cuidado general";

const CANTIDAD_RESENAS_PREVIEW = 3;

export default function CuidadorDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cuidadorId = params.id;
  const [modalResenasAbierto, setModalResenasAbierto] = useState(false);

  const { data: cuidador, isLoading, isError } = useQuery({
    queryKey: ["cuidador", cuidadorId],
    queryFn: () => fetchCuidadorDetalle(cuidadorId),
    retry: false,
  });

  const { data: resenas = [] } = useQuery({
    queryKey: ["cuidador", cuidadorId, "resenas"],
    queryFn: () => fetchResenasCuidador(cuidadorId),
  });

  const valoracionMedia =
    resenas.length > 0 ? resenas.reduce((suma, r) => suma + r.valoracion, 0) / resenas.length : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando perfil…</p>
      ) : isError || !cuidador ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No se ha encontrado este cuidador.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {cuidador.nombre[0]}
              {cuidador.apellidos[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">
                {cuidador.nombre} {cuidador.apellidos}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Estrellas valor={valoracionMedia} size="md" />
                <span className="text-sm font-medium text-foreground">{valoracionMedia.toFixed(1)}</span>
                {cuidador.identidadVerificada && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verificado
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border">
            <div className="bg-background p-3.5 text-center">
              <p className="text-lg font-semibold text-foreground">{cuidador.cuidadosRealizados}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">cuidados</p>
            </div>
            <div className="bg-background p-3.5 text-center">
              <p className="text-lg font-semibold text-foreground">{formatearAntiguedad(cuidador.cuidadorDesde)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">en la app</p>
            </div>
            <div className="bg-background p-3.5 text-center">
              <p className="text-lg font-semibold text-foreground">
                {cuidador.tarifaHora != null ? `${cuidador.tarifaHora} €` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {cuidador.tarifaHora != null ? "por hora" : "sin tarifa"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Especialidad</p>
            <p className="mt-1 text-sm font-medium text-foreground">{DEFAULT_ESPECIALIDAD}</p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hospitales donde trabaja
            </p>
            {cuidador.hospitales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no ha indicado ningún hospital.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cuidador.hospitales.map((h) => (
                  <li key={h.id} className="flex items-center gap-2 text-sm text-foreground">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {h.nombre} <span className="text-muted-foreground">· {h.ciudad}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reseñas</p>
              {resenas.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Estrellas valor={valoracionMedia} />
                  {valoracionMedia.toFixed(1)} ({resenas.length})
                </span>
              )}
            </div>

            {resenas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este cuidador todavía no tiene reseñas.</p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {resenas.slice(0, CANTIDAD_RESENAS_PREVIEW).map((resena) => (
                    <div key={resena.id} className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{resena.autorNombre}</p>
                        <Estrellas valor={resena.valoracion} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatearFecha(resena.creadoEn)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{resena.comentario}</p>
                    </div>
                  ))}
                </div>

                {resenas.length > CANTIDAD_RESENAS_PREVIEW && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => setModalResenasAbierto(true)}
                  >
                    Ver todas las reseñas ({resenas.length})
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {cuidador && <ModalResenas open={modalResenasAbierto} onOpenChange={setModalResenasAbierto} resenas={resenas} />}
    </div>
  );
}
