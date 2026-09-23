"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, Mail, Phone, ShieldCheck, Star } from "lucide-react";
import { fetchAdminCuidador } from "@/lib/api/admin";
import { formatearFecha } from "@/lib/fecha";
import EstadoUsuarioBadge from "@/components/admin/EstadoUsuarioBadge";
import AccionesEstadoUsuario from "@/components/admin/AccionesEstadoUsuario";

export default function AdminCuidadorDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cuidadorId = params.id;

  const { data: cuidador, isLoading, isError } = useQuery({
    queryKey: ["admin", "cuidadores", cuidadorId],
    queryFn: () => fetchAdminCuidador(cuidadorId),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando cuidador…</p>
      ) : isError || !cuidador ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No se ha encontrado este cuidador.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {cuidador.nombre[0]}
              {cuidador.apellidos[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {cuidador.nombre} {cuidador.apellidos}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <EstadoUsuarioBadge estado={cuidador.estado} />
                {cuidador.identidadVerificada && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Identidad verificada
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contacto</p>
            <div className="flex flex-col gap-2 text-sm text-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                {cuidador.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                {cuidador.telefono ?? "Sin teléfono"}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                Registrado el {formatearFecha(cuidador.creadoEn)}
                {cuidador.ultimoLoginEn && ` · Último acceso ${formatearFecha(cuidador.ultimoLoginEn)}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border">
            <div className="bg-background p-3.5 text-center">
              <p className="text-lg font-semibold text-foreground">{cuidador.cuidadosRealizados}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">cuidados</p>
            </div>
            <div className="bg-background p-3.5 text-center">
              <p className="text-lg font-semibold text-foreground">
                {cuidador.tarifaHora != null ? `${cuidador.tarifaHora} €` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {cuidador.tarifaHora != null ? "por hora" : "sin tarifa"}
              </p>
            </div>
            <div className="bg-background p-3.5 text-center">
              <p className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                {cuidador.valoracionMedia != null ? (
                  <>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {cuidador.valoracionMedia.toFixed(1)}
                  </>
                ) : (
                  "—"
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">valoración</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gestión de la cuenta</p>
            <AccionesEstadoUsuario
              usuarioId={cuidador.id}
              estado={cuidador.estado}
              queryKeysAInvalidar={[["admin", "cuidadores"], ["admin", "cuidadores", cuidadorId]]}
            />
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
        </div>
      )}
    </div>
  );
}
