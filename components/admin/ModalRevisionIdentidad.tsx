"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchImagenVerificacion, type ImagenVerificacion, type VerificacionPendiente } from "@/lib/api/admin";
import { formatearFechaHora } from "@/lib/fecha";
import { useAccionesVerificacion } from "@/components/admin/useAccionesVerificacion";

interface ModalRevisionIdentidadProps {
  verificacion: VerificacionPendiente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IMAGENES: { id: ImagenVerificacion; titulo: string }[] = [
  { id: "anverso", titulo: "Parte delantera" },
  { id: "reverso", titulo: "Parte trasera" },
  { id: "selfie", titulo: "Cara sosteniendo el documento" },
];

export default function ModalRevisionIdentidad({ verificacion, open, onOpenChange }: ModalRevisionIdentidadProps) {
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false);
  const { aprobar, rechazar, ocupado } = useAccionesVerificacion(() => {
    setConfirmandoRechazo(false);
    onOpenChange(false);
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(abierto) => !ocupado && onOpenChange(abierto)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {verificacion.nombre} {verificacion.apellidos}
            </DialogTitle>
            <DialogDescription>
              {verificacion.email} · solicitud enviada el {formatearFechaHora(verificacion.enviadoEn)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-muted/50 px-4 py-2.5">
              <p className="text-xs text-muted-foreground">Documento indicado por el usuario</p>
              <p className="text-lg font-semibold tracking-wide text-foreground">
                {verificacion.tipoDocumento} {verificacion.numeroDocumento}
              </p>
            </div>
            {verificacion.documentoYaVerificado && (
              <div className="flex min-w-60 flex-1 items-start gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Este documento ya está verificado en otra cuenta. Comprueba que no sea un duplicado antes de
                  verificar.
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {IMAGENES.map((imagen) => (
              <ImagenDocumento
                key={imagen.id}
                verificacionId={verificacion.id}
                imagen={imagen.id}
                titulo={imagen.titulo}
              />
            ))}
          </div>

          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="outline" disabled={ocupado} onClick={() => setConfirmandoRechazo(true)}>
              Rechazar
            </Button>
            <Button type="button" disabled={ocupado} onClick={() => aprobar.mutate(verificacion.id)}>
              {aprobar.isPending ? "Verificando…" : "Verificar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmandoRechazo}
        onOpenChange={setConfirmandoRechazo}
        titulo="Rechazar solicitud"
        descripcion="Se eliminarán las imágenes enviadas y el cuidador podrá corregir sus datos y volver a solicitar la verificación."
        textoConfirmar="Rechazar"
        confirmando={rechazar.isPending}
        onConfirmar={() => rechazar.mutate(verificacion.id)}
      />
    </>
  );
}

// Las imágenes están protegidas: se descargan con la sesión del admin (cada
// consulta queda auditada en el servidor) y se muestran como blob local.
function ImagenDocumento({
  verificacionId,
  imagen,
  titulo,
}: {
  verificacionId: string;
  imagen: ImagenVerificacion;
  titulo: string;
}) {
  const { data: blob, isError } = useQuery({
    queryKey: ["admin", "verificacion-imagen", verificacionId, imagen],
    queryFn: () => fetchImagenVerificacion(verificacionId, imagen),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <figure>
      <figcaption className="mb-1.5 text-sm font-medium text-foreground">{titulo}</figcaption>
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-xl bg-muted/50">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" title="Abrir a tamaño completo" className="h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={titulo} className="h-full w-full object-contain" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            {isError ? "No se ha podido cargar la imagen" : "Cargando…"}
          </span>
        )}
      </div>
    </figure>
  );
}
