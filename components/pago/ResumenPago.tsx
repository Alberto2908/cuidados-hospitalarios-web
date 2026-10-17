"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { obtenerServicio, type Servicio } from "@/lib/api/servicios";
import { formatearEuros } from "@/lib/pago/formato";

type Rol = "paciente" | "cuidador";

/**
 * Texto de cada estado de pago, segun quien lo lee. El dinero pasa por tres
 * fases: cobrado y retenido en la plataforma (aun no es del cuidador), entregado
 * al cuidador, o devuelto a la familia.
 */
function textoPago(servicio: Servicio, rol: Rol): string {
  const total = formatearEuros(servicio.importeTotal);
  const entregado = servicio.importeCuidador ?? 0;

  // Cancelacion tardia con el pago ya hecho: el dinero queda retenido hasta que la
  // plataforma decide el reparto (ver AdminServicioController en el backend).
  if (servicio.estado === "cancelado" && servicio.estadoPago === "procesado") {
    return rol === "paciente"
      ? "El servicio se ha cancelado. Tu pago sigue retenido y la plataforma decidirá cuánto se te devuelve."
      : "El servicio se ha cancelado. El pago sigue retenido y la plataforma decidirá el reparto.";
  }

  if (rol === "paciente") {
    switch (servicio.estadoPago) {
      case "pendiente":
        return `Pago pendiente: ${total}. Se cobra cuando pagues el servicio.`;
      case "fallido":
        return "El último intento de pago ha fallado. Puedes volver a intentarlo.";
      case "procesado":
        return entregado > 0
          ? `Pago realizado (${total}). Ya se han entregado ${formatearEuros(entregado)} al cuidador por los días confirmados; el resto sigue retenido hasta que los confirmes.`
          : `Pago realizado (${total}). El dinero queda retenido y no se entrega al cuidador hasta que confirmes el cuidado.`;
      case "liberado":
        return servicio.importeReembolsado > 0
          ? `Cuidado confirmado. Se te han devuelto ${formatearEuros(servicio.importeReembolsado)} y el resto se ha entregado al cuidador.`
          : "Cuidado confirmado. El pago se ha entregado al cuidador.";
      case "reembolsado":
        return `El pago se te ha devuelto íntegramente (${formatearEuros(servicio.importeReembolsado)}).`;
    }
  }

  switch (servicio.estadoPago) {
    case "pendiente":
    case "fallido":
      return "Pendiente de pago por parte del paciente/familiar.";
    case "procesado":
      return entregado > 0
        ? `Ya has recibido ${formatearEuros(entregado)} por los días confirmados. El resto, retenido, lo recibirás según se confirmen los demás días.`
        : `El pago (${total}) está cobrado y retenido. Lo recibirás cuando el paciente/familiar confirme el cuidado.`;
    case "liberado":
      return `Has recibido ${formatearEuros(entregado)}, ya descontada la comisión de la plataforma.`;
    case "reembolsado":
      return "El pago se ha devuelto a la familia.";
  }
}

/** Estado del pago de un servicio, para el paciente/familiar o para el cuidador. */
export default function ResumenPago({ servicioId, rol }: { servicioId: string; rol: Rol }) {
  const { user } = useAuth();
  const servicioQuery = useQuery({
    queryKey: ["servicio", servicioId],
    queryFn: () => obtenerServicio(servicioId),
  });

  const servicio = servicioQuery.data;
  if (!servicio) {
    return null;
  }

  // El cuidador no recibe nada hasta completar el alta en Stripe.
  const faltaAlta =
    rol === "cuidador" &&
    servicio.estadoPago === "procesado" &&
    user?.rol === "CUIDADOR" &&
    !user.stripeCobrosHabilitados;

  return (
    <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-muted/50 p-3 text-sm text-foreground">
      <div className="flex items-start gap-2">
        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p>{textoPago(servicio, rol)}</p>
      </div>
      {faltaAlta && (
        <p className="pl-6 text-xs text-amber-700 dark:text-amber-300">
          Para recibir el dinero tienes que{" "}
          <Link href="/perfil" className="font-medium underline">
            completar tus datos de cobro
          </Link>
          .
        </p>
      )}
    </div>
  );
}
