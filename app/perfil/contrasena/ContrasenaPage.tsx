"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { ArrowLeft, Eye, EyeOff, KeyRound, Check, X } from "lucide-react";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const REQUISITOS_PASSWORD = [
  { label: "Al menos 8 caracteres", cumple: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", cumple: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", cumple: (p: string) => /\d/.test(p) },
  { label: "Un símbolo", cumple: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ContrasenaPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-muted/30">
      {/*
       * min-h-[70vh] en vez de depender de min-h-full/flex-1 sobre <main>:
       * eso requeria que <main> fuera un contenedor flex (display:flex), lo
       * cual rompia el mx-auto max-w-* de TODAS las demas paginas (el margen
       * automatico de un flex-item no estira/centra igual que en flujo
       * normal, se encoge al contenido). vh es autosuficiente, no depende
       * de ningun ancestro.
       */}
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a mi perfil
        </Link>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <KeyRound className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Cambiar contraseña</h1>
          </div>

          {user.proveedorAuth === "GOOGLE" ? (
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Inicias sesión con Google, así que tu cuenta no tiene una contraseña que cambiar aquí.
            </p>
          ) : (
            <FormularioContrasena />
          )}
        </div>
      </div>
    </div>
  );
}

function FormularioContrasena() {
  const { cambiarContrasena } = useAuth();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardado(false);

    if (!actual || !nueva || !confirmar) {
      setError("Rellena todos los campos.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (!PASSWORD_REGEX.test(nueva)) {
      setError("La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.");
      return;
    }

    setEnviando(true);
    try {
      await cambiarContrasena(actual, nueva);
      setGuardado(true);
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se ha podido cambiar la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
      {guardado && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Contraseña actualizada correctamente.
        </div>
      )}

      <FloatingInput
        id="contrasena-actual"
        type={showActual ? "text" : "password"}
        label="Contraseña actual"
        value={actual}
        onChange={(e) => setActual(e.target.value)}
        autoComplete="current-password"
        rightElement={
          <button
            type="button"
            onClick={() => setShowActual(!showActual)}
            className="text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

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
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {enviando ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
