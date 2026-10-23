"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { MailCheck } from "lucide-react";

const SEGUNDOS_ENTRE_REENVIOS = 60;

export default function VerificarEmailPage() {
  const { user, isLoading, isAuthenticated, verificarEmail, reenviarVerificacionEmail } = useAuth();
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Cuenta atrás hasta poder pedir otro código.
  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Cargando...
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\d{6}$/.test(codigo)) {
      sileo.error({ title: "Introduce el código de 6 dígitos" });
      return;
    }

    setEnviando(true);
    try {
      await verificarEmail(codigo);
      sileo.success({ title: "Email verificado" });
      router.push("/");
    } catch (err) {
      sileo.error({ title: err instanceof ApiError ? err.message : "No se ha podido verificar el email" });
    } finally {
      setEnviando(false);
    }
  }

  async function handleReenviar() {
    setReenviando(true);
    try {
      await reenviarVerificacionEmail();
      setCodigo("");
      setEspera(SEGUNDOS_ENTRE_REENVIOS);
      sileo.success({ title: "Te hemos enviado un código nuevo" });
    } catch (err) {
      sileo.error({ title: err instanceof ApiError ? err.message : "No se ha podido reenviar el código" });
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-primary">
            <MailCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Verifica tu email</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {user.emailVerificado
              ? "Tu email ya está verificado."
              : <>Hemos enviado un código de 6 dígitos a <span className="font-medium text-foreground">{user.email}</span>.</>}
          </p>
        </div>

        {user.emailVerificado ? (
          <div className="rounded-2xl bg-card p-6 shadow-float">
            <Link
              href="/"
              className="block w-full rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90"
            >
              Ir al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-card p-6 shadow-float">
            <FloatingInput
              id="codigo"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              label="Código de verificación"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
              autoFocus
            />

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {enviando ? "Verificando..." : "Verificar"}
            </button>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">¿No te ha llegado el código?</span>
              <button
                type="button"
                onClick={handleReenviar}
                disabled={reenviando || espera > 0}
                className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                {espera > 0 ? `Reenviar (${espera} s)` : "Reenviar"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          El código caduca a los 15 minutos. Revisa también la carpeta de spam.
        </p>
      </div>
    </div>
  );
}
