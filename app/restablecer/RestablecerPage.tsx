"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sileo } from "sileo";
import { ApiError } from "@/lib/api/client";
import { restablecerContrasena } from "@/lib/auth/api";
import { PASSWORD_REGEX, REQUISITOS_PASSWORD } from "@/lib/auth/password";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { Check, Eye, EyeOff, KeyRound, X } from "lucide-react";

export default function RestablecerPage() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nueva || !confirmar) {
      setError("Rellena todos los campos.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!PASSWORD_REGEX.test(nueva)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.");
      return;
    }

    setEnviando(true);
    try {
      await restablecerContrasena(token, nueva);
      sileo.success({ title: "Contraseña actualizada. Inicia sesión con la nueva." });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se ha podido cambiar la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-6 shadow-float">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <KeyRound className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Elige una nueva contraseña</h1>
          </div>

          {!token ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-surface-sunken px-4 py-3 text-sm text-muted-foreground shadow-inset-soft">
                El enlace no es válido. Solicita uno nuevo para restablecer tu contraseña.
              </p>
              <Link href="/recuperar" className="block text-center text-sm font-medium text-primary hover:underline">
                Solicitar un enlace nuevo
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="space-y-1 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  <p>{error}</p>
                  <Link href="/recuperar" className="font-medium underline underline-offset-2">
                    Solicitar un enlace nuevo
                  </Link>
                </div>
              )}

              <div className="space-y-1.5">
                <FloatingInput
                  id="contrasena-nueva"
                  type={showNueva ? "text" : "password"}
                  label="Nueva contraseña"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowNueva(!showNueva)}
                      className="text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {nueva.length > 0 && (
                  <ul className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2">
                    {REQUISITOS_PASSWORD.map((req) => {
                      const cumple = req.cumple(nueva);
                      return (
                        <li
                          key={req.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            cumple ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          }`}
                        >
                          {cumple ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5">
                <FloatingInput
                  id="contrasena-confirmar"
                  type={showConfirmar ? "text" : "password"}
                  label="Confirmar nueva contraseña"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmar(!showConfirmar)}
                      className="text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {confirmar.length > 0 && (
                  <p
                    className={`flex items-center gap-1.5 text-xs ${
                      nueva === confirmar ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {nueva === confirmar ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Las contraseñas coinciden
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5" /> Las contraseñas no coinciden
                      </>
                    )}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {enviando ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
