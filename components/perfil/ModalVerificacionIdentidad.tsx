"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  documentoValido,
  EJEMPLO_DOCUMENTO,
  normalizarDocumento,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from "@/lib/documento";
import { FORMATOS_IMAGEN_ACEPTADOS, ImagenNoValidaError, prepararImagen } from "@/lib/imagen/prepararImagen";
import type { VerificacionIdentidadDatos } from "@/lib/auth/api";

interface ModalVerificacionIdentidadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombre: string;
  apellidos: string;
  tipoDocumentoInicial: TipoDocumento | null;
  numeroDocumentoInicial: string | null;
  onEnviar: (datos: VerificacionIdentidadDatos) => void;
  enviando: boolean;
}

interface ImagenElegida {
  archivo: File;
  vistaPrevia: string;
}

type Slot = "anverso" | "reverso" | "selfie";

const SLOTS: { id: Slot; titulo: string; ayuda: string }[] = [
  { id: "anverso", titulo: "Parte delantera", ayuda: "Foto nítida y completa." },
  { id: "reverso", titulo: "Parte trasera", ayuda: "Foto nítida y completa." },
  { id: "selfie", titulo: "Tu cara con el documento", ayuda: "Cara y documento bien visibles." },
];

const CLASE_CAMPO =
  "h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground shadow-input outline-none ring-ring transition-shadow focus:ring-2";

// Sin useEffect para resetear al reabrir: igual que ModalResena, el padre
// pasa una `key` que cambia cada vez que se abre para que remonte en blanco.
export default function ModalVerificacionIdentidad({
  open,
  onOpenChange,
  nombre,
  apellidos,
  tipoDocumentoInicial,
  numeroDocumentoInicial,
  onEnviar,
  enviando,
}: ModalVerificacionIdentidadProps) {
  const [tipo, setTipo] = useState<TipoDocumento>(tipoDocumentoInicial ?? "DNI");
  const [numero, setNumero] = useState(numeroDocumentoInicial ?? "");
  const [imagenes, setImagenes] = useState<Partial<Record<Slot, ImagenElegida>>>({});
  const [procesando, setProcesando] = useState<Slot | null>(null);
  const [errorImagen, setErrorImagen] = useState<Partial<Record<Slot, string>>>({});
  const [intentado, setIntentado] = useState(false);

  // Las URL de vista previa se liberan al cerrar/remontar la modal.
  const urlsRef = useRef<string[]>([]);
  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const numeroNormalizado = normalizarDocumento(numero);
  const numeroErroneo = numero.trim() !== "" && !documentoValido(tipo, numero);

  async function handleElegirImagen(slot: Slot, archivo: File | undefined) {
    if (!archivo) return;
    setProcesando(slot);
    setErrorImagen((e) => ({ ...e, [slot]: undefined }));
    try {
      const preparada = await prepararImagen(archivo);
      const vistaPrevia = URL.createObjectURL(preparada);
      urlsRef.current.push(vistaPrevia);
      setImagenes((actual) => ({ ...actual, [slot]: { archivo: preparada, vistaPrevia } }));
    } catch (err) {
      const mensaje = err instanceof ImagenNoValidaError ? err.message : "No se ha podido procesar la imagen.";
      setErrorImagen((e) => ({ ...e, [slot]: mensaje }));
    } finally {
      setProcesando(null);
    }
  }

  function handleEnviar() {
    setIntentado(true);
    const { anverso, reverso, selfie } = imagenes;
    if (!documentoValido(tipo, numero) || !anverso || !reverso || !selfie) return;
    onEnviar({
      tipoDocumento: tipo,
      numeroDocumento: numeroNormalizado,
      anverso: anverso.archivo,
      reverso: reverso.archivo,
      selfie: selfie.archivo,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(abierto) => !enviando && onOpenChange(abierto)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Verificar mi identidad</DialogTitle>
          <DialogDescription>
            Un administrador revisará tu documento. Hasta que esté verificado no aparecerás en las búsquedas de
            cuidadores ni podrás inscribirte en anuncios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Una vez enviada la solicitud, tu <strong>nombre, apellidos y documento no se podrán modificar</strong>, ni
            durante la revisión ni después de verificarte. Comprueba que son correctos antes de enviar.
          </span>
        </div>

        {/* Datos */}
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.3fr]">
          <div className="grid content-start gap-1.5">
            <span className="text-sm font-medium text-foreground">Nombre</span>
            <p className="h-10 truncate rounded-xl bg-muted/50 px-3.5 text-sm leading-10 text-foreground">{nombre}</p>
          </div>
          <div className="grid content-start gap-1.5">
            <span className="text-sm font-medium text-foreground">Apellidos</span>
            <p className="h-10 truncate rounded-xl bg-muted/50 px-3.5 text-sm leading-10 text-foreground">{apellidos}</p>
          </div>
          <div className="grid content-start gap-1.5">
            <label htmlFor="verif-numero" className="text-sm font-medium text-foreground">
              Documento de identidad
            </label>
            <div className="grid grid-cols-[84px_1fr] gap-2">
              <Select
                value={tipo}
                onValueChange={(valor) => setTipo(valor as TipoDocumento)}
                items={TIPOS_DOCUMENTO.map((t) => ({ value: t, label: t }))}
              >
                <SelectTrigger aria-label="Tipo de documento" className="h-10 rounded-xl py-0 pl-3.5 text-sm shadow-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                id="verif-numero"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder={EJEMPLO_DOCUMENTO[tipo]}
                autoComplete="off"
                className={`${CLASE_CAMPO} placeholder:text-muted-foreground`}
              />
            </div>
            {(numeroErroneo || (intentado && numero.trim() === "")) && (
              <p className="text-xs text-destructive">
                {numero.trim() === ""
                  ? "Indica el número de tu documento."
                  : `Número no válido. Revisa dígitos y letra (ej. ${EJEMPLO_DOCUMENTO[tipo]}).`}
              </p>
            )}
          </div>
        </div>

        {/* Imágenes */}
        <div className="grid gap-3 sm:grid-cols-3">
          {SLOTS.map((slot) => {
            const imagen = imagenes[slot.id];
            const error =
              errorImagen[slot.id] ?? (intentado && !imagen ? "Añade esta imagen para continuar." : undefined);
            return (
              <div key={slot.id} className="grid content-start gap-1.5">
                <span className="text-sm font-medium text-foreground">{slot.titulo}</span>
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-card p-2 text-center shadow-input transition-shadow focus-within:ring-2 focus-within:ring-ring hover:bg-muted/30">
                  {imagen ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagen.vistaPrevia} alt="" className="min-h-0 w-full flex-1 rounded-lg object-cover" />
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Añadida · pulsa para cambiarla
                      </span>
                    </>
                  ) : (
                    <>
                      {procesando === slot.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {procesando === slot.id ? (
                          "Procesando imagen…"
                        ) : (
                          <>
                            <span className="block text-sm font-medium text-foreground">Elegir imagen o hacer foto</span>
                            {slot.ayuda}
                          </>
                        )}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept={FORMATOS_IMAGEN_ACEPTADOS}
                    className="sr-only"
                    onChange={(e) => {
                      void handleElegirImagen(slot.id, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            );
          })}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="outline" disabled={enviando} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={enviando || procesando !== null} onClick={handleEnviar}>
            {enviando ? "Enviando…" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
