"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { iniciarPagoServicio, obtenerServicio } from "@/lib/api/servicios";
import { obtenerStripe, stripeConfigurado } from "@/lib/stripe/config";

// Segundos que se espera a que el backend confirme el pago (Stripe lo avisa por
// webhook, normalmente en uno o dos segundos) antes de dar el aviso de demora.
const ESPERA_CONFIRMACION_MS = 30_000;

interface ModalPagoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId: string | null;
  /** Se llama cuando el backend ya ha registrado el pago (estadoPago = "procesado"). */
  onPagado: () => void;
}

/**
 * Formulario de pago de un servicio aceptado. Los datos de la tarjeta los
 * recoge Stripe en su propio formulario (Payment Element): nunca pasan por
 * este servidor. El padre debe pasar una `key` distinta cada vez que se abre
 * el modal para que arranque limpio (como ModalContraoferta).
 */
export default function ModalPago({ open, onOpenChange, servicioId, onPagado }: ModalPagoProps) {
  const intentoQuery = useQuery({
    queryKey: ["pago", "intento", servicioId],
    queryFn: () => iniciarPagoServicio(servicioId as string),
    enabled: open && Boolean(servicioId) && stripeConfigurado,
    // El secreto es de un solo uso por apertura: no se refresca solo.
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const stripePromesa = obtenerStripe();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* El formulario de la tarjeta es alto: el modal hace scroll en pantallas bajas. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagar el servicio</DialogTitle>
          <DialogDescription>
            El dinero queda retenido y no se entrega al cuidador hasta que confirmes que el cuidado se ha
            realizado.
          </DialogDescription>
        </DialogHeader>

        {!stripeConfigurado ? (
          <p className="rounded-xl bg-surface-sunken px-4 py-3 shadow-inset-soft text-sm text-muted-foreground">
            El pago no está configurado todavía en este entorno.
          </p>
        ) : intentoQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Preparando el pago…</p>
        ) : intentoQuery.isError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {intentoQuery.error.message}
          </p>
        ) : (
          <Elements
            stripe={stripePromesa}
            options={{ clientSecret: intentoQuery.data.clientSecret, locale: "es" }}
          >
            <FormularioPago
              servicioId={servicioId as string}
              importe={intentoQuery.data.importe}
              onPagado={onPagado}
              onCerrar={() => onOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioPago({
  servicioId,
  importe,
  onPagado,
  onCerrar,
}: {
  servicioId: string;
  importe: number;
  onPagado: () => void;
  onCerrar: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tras pagar, se espera a que el backend registre el cobro.
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
  const [demora, setDemora] = useState(false);

  const servicioQuery = useQuery({
    queryKey: ["servicio", servicioId, "pago"],
    queryFn: () => obtenerServicio(servicioId),
    enabled: esperandoConfirmacion,
    refetchInterval: (query) => (query.state.data?.estadoPago === "procesado" ? false : 1500),
    gcTime: 0,
  });

  const registrado = servicioQuery.data?.estadoPago === "procesado";

  useEffect(() => {
    if (registrado) {
      onPagado();
    }
  }, [registrado, onPagado]);

  useEffect(() => {
    if (!esperandoConfirmacion) {
      return;
    }
    const temporizador = setTimeout(() => setDemora(true), ESPERA_CONFIRMACION_MS);
    return () => clearTimeout(temporizador);
  }, [esperandoConfirmacion]);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setEnviando(true);
    setError(null);

    const { error: errorStripe, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Solo se usa si el metodo de pago obliga a salir de la pagina (p. ej. 3D Secure
      // en algunos bancos); con tarjeta normal se resuelve aqui mismo.
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (errorStripe) {
      setError(errorStripe.message ?? "No se ha podido completar el pago.");
      setEnviando(false);
      return;
    }
    if (paymentIntent && ["succeeded", "processing"].includes(paymentIntent.status)) {
      setEsperandoConfirmacion(true);
      return;
    }
    setError("El pago no se ha completado. Inténtalo de nuevo.");
    setEnviando(false);
  }

  if (esperandoConfirmacion) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground">
          {demora
            ? "Hemos recibido tu pago, pero tarda unos segundos más de lo normal en reflejarse. Puedes cerrar esta ventana: se actualizará solo."
            : "Pago recibido. Confirmándolo…"}
        </p>
        {demora && (
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Sin Link (guardar datos con email/movil): alarga el formulario y no aporta aqui. */}
      <PaymentElement options={{ wallets: { link: "never" } }} />
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!stripe || !elements || enviando}>
        {enviando ? "Procesando…" : `Pagar ${importe.toFixed(2).replace(".", ",")} €`}
      </Button>
    </form>
  );
}
