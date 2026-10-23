"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onCredential: (idToken: string) => void;
}

export default function GoogleLoginButton({ onCredential }: GoogleLoginButtonProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const { resolvedTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";

  // El callback va en una ref: el padre lo recrea en cada render (cada tecla
  // que se escribe en el formulario) y, si el efecto dependiera de él,
  // Google reconstruiría el iframe del botón en cada pulsación (parpadeo).
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;
    const idDeCliente = clientId;

    function inicializar() {
      if (!window.google || !contenedorRef.current) return;
      window.google.accounts.id.initialize({
        client_id: idDeCliente,
        callback: (resp) => onCredentialRef.current(resp.credential),
      });
      window.google.accounts.id.renderButton(contenedorRef.current, {
        theme: oscuro ? "filled_black" : "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill",
        locale: "es",
      });
    }

    if (window.google) {
      inicializar();
      return;
    }

    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        inicializar();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [clientId, oscuro]);

  if (!clientId) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      {/* color-scheme: light en el contenedor: el iframe de Google es un
          documento claro y, si hereda color-scheme: dark del <html> (lo pone
          next-themes), el navegador le pinta un lienzo blanco opaco detras
          del boton (el rectangulo blanco que se veia en modo oscuro). */}
      <div ref={contenedorRef} className="flex justify-center" style={{ colorScheme: "light" }} />
    </>
  );
}
