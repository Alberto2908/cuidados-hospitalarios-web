"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (!clientId) return;
    const idDeCliente = clientId;

    function inicializar() {
      if (!window.google || !contenedorRef.current) return;
      window.google.accounts.id.initialize({
        client_id: idDeCliente,
        callback: (resp) => onCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(contenedorRef.current, {
        theme: "outline",
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
  }, [clientId, onCredential]);

  if (!clientId) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div ref={contenedorRef} className="flex justify-center" />
    </>
  );
}
