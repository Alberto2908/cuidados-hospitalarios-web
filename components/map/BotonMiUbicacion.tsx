"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onLocated: (coords: { lat: number; lng: number; zoom: number }) => void;
  className?: string;
}

export default function BotonMiUbicacion({ onLocated, className }: Props) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (!navigator.geolocation) {
      sileo.error({
        title: "Ubicación no disponible",
        description: "Tu navegador no permite geolocalización.",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocated({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          zoom: 13,
        });
        sileo.success({
          title: "Ubicación encontrada",
          description: "El mapa se ha centrado cerca de ti.",
        });
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          sileo.warning({
            title: "Permiso denegado",
            description:
              "Activa la ubicación en el navegador o busca una ciudad.",
          });
        } else if (err.code === err.TIMEOUT) {
          sileo.error({
            title: "Tiempo agotado",
            description: "No hemos podido obtener tu ubicación. Inténtalo de nuevo.",
          });
        } else {
          sileo.error({
            title: "No se pudo localizar",
            description: "Prueba a buscar una ciudad o un hospital.",
          });
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60_000,
      },
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "h-auto shrink-0 gap-1.5 px-0 py-0 text-sm font-normal text-foreground underline underline-offset-4 hover:text-foreground/80",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <MapPin className="size-3.5 fill-current [&_circle]:fill-white" />
      )}
      {loading ? "Localizando…" : "Mi ubicación"}
    </Button>
  );
}
