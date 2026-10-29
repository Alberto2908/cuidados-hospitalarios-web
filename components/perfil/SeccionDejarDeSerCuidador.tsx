"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { sileo } from "sileo";
import { Undo2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import { estadoDejarDeSerCuidador } from "@/lib/auth/api";
import { AvisoAdvertencia } from "@/components/ui/aviso-advertencia";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const DESCRIPCION_CONFIRMACION =
  "Se borrarán tu tarifa y tus hospitales, y se retirarán tus inscripciones pendientes. Tu verificación de identidad y tu cuenta de cobro de Stripe se conservan. Si te conviertes otra vez en cuidador, tendrás que volver a indicar tu tarifa y tus hospitales.";

/**
 * Volver a ser solo familiar/paciente. El servidor decide si se puede (ningún cuidado completado
 * ni un cuidado ya pagado en marcha); solo se ofrece cuando dice que sí, y él lo vuelve a comprobar
 * al pedirlo.
 */
export default function SeccionDejarDeSerCuidador() {
  const { user, dejarDeSerCuidador } = useAuth();
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { data: estado } = useQuery({
    // Con el id del usuario: la caché es global y, al cambiar de cuenta, no debe verse la respuesta de la anterior.
    queryKey: ["usuario", user?.id, "dejar-de-ser-cuidador"],
    queryFn: estadoDejarDeSerCuidador,
  });

  async function handleDejar() {
    setEnviando(true);
    try {
      await dejarDeSerCuidador();
      setConfirmando(false);
      sileo.success({
        title: "Vuelves a ser familiar",
        description: "Se han borrado tu tarifa y tus hospitales. Si te conviertes otra vez, tendrás que volver a indicarlos.",
      });
      router.push("/");
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se ha podido completar el cambio.";
      sileo.error({ title: "No se ha podido completar", description: mensaje });
    } finally {
      setEnviando(false);
    }
  }

  if (!estado?.permitido) return null;

  return (
    <div className="rounded-2xl bg-card p-6 shadow-float">
      <div className="mb-4 flex items-center gap-2 text-foreground">
        <Undo2 className="h-5 w-5 text-accent-foreground" />
        <h2 className="text-lg font-semibold">Dejar de ser cuidador</h2>
      </div>
      <AvisoAdvertencia className="mb-4">
        Vuelves a tener el perfil de familiar. Se borran tu tarifa y tus hospitales, y se retiran tus inscripciones que
        aún no estén pagadas. Si más adelante te conviertes otra vez,{" "}
        <strong>tendrás que volver a indicar tu tarifa y tus hospitales</strong>. Tu verificación de identidad y tu
        cuenta de cobro de Stripe se conservan, y tu nombre y apellidos seguirán bloqueados.
      </AvisoAdvertencia>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90"
      >
        Dejar de ser cuidador
      </button>
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        titulo="¿Dejar de ser cuidador?"
        descripcion={DESCRIPCION_CONFIRMACION}
        textoConfirmar="Dejar de ser cuidador"
        confirmando={enviando}
        onConfirmar={handleDejar}
      />
    </div>
  );
}
