"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { solicitarRecuperacionContrasena } from "@/lib/auth/api";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Introduce el email de tu cuenta.");
      return;
    }

    setEnviando(true);
    try {
      await solicitarRecuperacionContrasena(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se ha podido enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
        </Link>

        <div className="rounded-2xl bg-card p-6 shadow-float">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <KeyRound className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Recuperar contraseña</h1>
          </div>

          {enviado ? (
            <p className="rounded-xl bg-surface-sunken px-4 py-3 text-sm text-muted-foreground shadow-inset-soft">
              Si existe una cuenta con ese email, recibirás en unos minutos un enlace para elegir una
              nueva contraseña. Revisa también la carpeta de spam.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Introduce el email de tu cuenta y te enviaremos un enlace para elegir una nueva contraseña.
              </p>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <FloatingInput
                id="email"
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
