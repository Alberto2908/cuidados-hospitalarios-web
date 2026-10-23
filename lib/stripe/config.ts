import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Clave PUBLICABLE de Stripe (pk_test_... / pk_live_...): es publica por
// diseño y va en el navegador. La clave secreta vive solo en el backend.
const CLAVE_PUBLICABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const stripeConfigurado = Boolean(CLAVE_PUBLICABLE);

let stripePromesa: Promise<Stripe | null> | null = null;

// loadStripe descarga el script de Stripe: se hace una sola vez y solo cuando
// de verdad se va a pagar, no al cargar cualquier pagina.
export function obtenerStripe(): Promise<Stripe | null> | null {
  if (!CLAVE_PUBLICABLE) {
    return null;
  }
  stripePromesa ??= loadStripe(CLAVE_PUBLICABLE);
  return stripePromesa;
}
