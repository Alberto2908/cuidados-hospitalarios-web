"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, FileText, Mail, Phone, ShieldCheck } from "lucide-react";
import { fetchAdminPaciente, type AdminAnuncioResumen } from "@/lib/api/admin";
import { formatearFecha } from "@/lib/fecha";
import EstadoUsuarioBadge from "@/components/admin/EstadoUsuarioBadge";
import AccionesEstadoUsuario from "@/components/admin/AccionesEstadoUsuario";

const ESTADO_ANUNCIO_LABEL: Record<AdminAnuncioResumen["estado"], string> = {
  activo: "Activo",
  cubierto: "Aceptado",
  cancelado: "Cancelado",
};

const ESTADO_ANUNCIO_COLOR: Record<AdminAnuncioResumen["estado"], string> = {
  activo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  cubierto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminPacienteDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pacienteId = params.id;

  const { data: paciente, isLoading, isError } = useQuery({
    queryKey: ["admin", "pacientes", pacienteId],
    queryFn: () => fetchAdminPaciente(pacienteId),
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
        <p className="text-sm text-muted-foreground">Cargando paciente…</p>
      ) : isError || !paciente ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No se ha encontrado este paciente.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                {paciente.nombre[0]}
                {paciente.apellidos[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {paciente.nombre} {paciente.apellidos}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <EstadoUsuarioBadge estado={paciente.estado} />
                  {paciente.identidadVerificada && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Identidad verificada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contacto</p>
            <div className="flex flex-col gap-2 text-sm text-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                {paciente.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                {paciente.telefono ?? "Sin teléfono"}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                Registrado el {formatearFecha(paciente.creadoEn)}
                {paciente.ultimoLoginEn && ` · Último acceso ${formatearFecha(paciente.ultimoLoginEn)}`}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gestión de la cuenta</p>
            <AccionesEstadoUsuario
              usuarioId={paciente.id}
              estado={paciente.estado}
              queryKeysAInvalidar={[["admin", "pacientes"], ["admin", "pacientes", pacienteId]]}
            />
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Anuncios ({paciente.anuncios.length})
            </p>
            {paciente.anuncios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no ha publicado ningún anuncio.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {paciente.anuncios.map((anuncio) => (
                  <li key={anuncio.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{anuncio.titulo}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_ANUNCIO_COLOR[anuncio.estado]}`}>
                        {ESTADO_ANUNCIO_LABEL[anuncio.estado]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {anuncio.hospital.nombre} · {anuncio.hospital.ciudad} · {formatearFecha(anuncio.creadoEn)}
                    </p>
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
