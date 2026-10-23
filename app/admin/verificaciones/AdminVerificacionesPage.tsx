"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fetchVerificacionesPendientes, type VerificacionPendiente } from "@/lib/api/admin";
import { formatearFechaHora } from "@/lib/fecha";
import ModalRevisionIdentidad from "@/components/admin/ModalRevisionIdentidad";
import { useAccionesVerificacion } from "@/components/admin/useAccionesVerificacion";

export default function AdminVerificacionesPage() {
  const [seleccionada, setSeleccionada] = useState<VerificacionPendiente | null>(null);
  const [rechazando, setRechazando] = useState<VerificacionPendiente | null>(null);
  // La fila cuya acción está en curso (para deshabilitar solo sus botones).
  const [enCurso, setEnCurso] = useState<string | null>(null);

  const { data: pendientes = [], isLoading } = useQuery({
    queryKey: ["admin", "verificaciones"],
    queryFn: fetchVerificacionesPendientes,
  });

  const { aprobar, rechazar } = useAccionesVerificacion(() => {
    setRechazando(null);
    setEnCurso(null);
  });

  function handleAprobar(v: VerificacionPendiente) {
    setEnCurso(v.id);
    aprobar.mutate(v.id, { onError: () => setEnCurso(null) });
  }

  function handleRechazar(v: VerificacionPendiente) {
    setEnCurso(v.id);
    rechazar.mutate(v.id, {
      onError: () => {
        setEnCurso(null);
        setRechazando(null);
      },
    });
  }

  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Verificaciones de identidad</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Solicitudes pendientes de revisar, de la más antigua a la más reciente.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-float">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cuidador</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Documento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Enviada</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Aviso</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              ) : pendientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <ShieldCheck className="mx-auto mb-2 h-6 w-6" />
                    No hay verificaciones pendientes
                  </td>
                </tr>
              ) : (
                pendientes.map((v) => {
                  const ocupada = enCurso === v.id;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSeleccionada(v)}
                      className="cursor-pointer transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-foreground">
                          {v.nombre} {v.apellidos}
                        </p>
                        <p className="text-xs text-muted-foreground">{v.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-foreground">
                        {v.tipoDocumento} {v.numeroDocumento}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{formatearFechaHora(v.enviadoEn)}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {v.documentoYaVerificado && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" /> Documento duplicado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={ocupada}
                            onClick={() => setRechazando(v)}
                          >
                            Rechazar
                          </Button>
                          <Button type="button" size="sm" variant="success" disabled={ocupada} onClick={() => handleAprobar(v)}>
                            {ocupada && aprobar.isPending ? "Verificando…" : "Verificar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {pendientes.length} {pendientes.length === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
        </div>
      </div>

      {seleccionada && (
        <ModalRevisionIdentidad
          key={seleccionada.id}
          verificacion={seleccionada}
          open
          onOpenChange={(abierta) => !abierta && setSeleccionada(null)}
        />
      )}

      <ConfirmDialog
        open={rechazando !== null}
        onOpenChange={(abierto) => !abierto && setRechazando(null)}
        titulo="Rechazar solicitud"
        descripcion="Se eliminarán las imágenes enviadas y el cuidador podrá corregir sus datos y volver a solicitar la verificación."
        textoConfirmar="Rechazar"
        confirmando={rechazar.isPending}
        onConfirmar={() => rechazando && handleRechazar(rechazando)}
      />
    </div>
  );
}
