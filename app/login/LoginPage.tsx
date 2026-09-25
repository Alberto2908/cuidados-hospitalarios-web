"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { HeartPulse, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, loginConGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      sileo.error({ title: "Introduce tu email y contraseña" });
      return;
    }

    setEnviando(true);
    try {
      await login(email, password);
      sileo.success({ title: "Sesión iniciada" });
      router.push("/");
    } catch (err) {
      sileo.error({ title: err instanceof ApiError ? err.message : "No se ha podido iniciar sesión" });
    } finally {
      setEnviando(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    try {
      await loginConGoogle(idToken);
      sileo.success({ title: "Sesión iniciada" });
      router.push("/");
    } catch (err) {
      sileo.error({ title: err instanceof ApiError ? err.message : "No se ha podido iniciar sesión con Google" });
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md">
        {/* Cabecera */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-primary">
            <HeartPulse className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Accede a tu cuenta de Cuidados Hospitalarios
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card p-6 shadow-float space-y-5"
        >
          <GoogleLoginButton onCredential={handleGoogleCredential} />

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o continúa con email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <FloatingInput
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <FloatingInput
            id="password"
            type={showPassword ? "text" : "password"}
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-border accent-primary" />
              Recordarme
            </label>
            <Link href="/recuperar" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {enviando ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Enlace a registro */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
