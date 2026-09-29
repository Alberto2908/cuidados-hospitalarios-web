"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { HeartPulse, Eye, EyeOff, Check, X } from "lucide-react";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const REQUISITOS_PASSWORD = [
  { label: "Al menos 8 caracteres", cumple: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", cumple: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", cumple: (p: string) => /\d/.test(p) },
  { label: "Un símbolo", cumple: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegistroPage() {
  const { registrar, loginConGoogle } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nombre || !apellidos || !email || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.");
      return;
    }

    setEnviando(true);
    try {
      await registrar({ nombre, apellidos, email, password, telefono: telefono || undefined });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se ha podido crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setError("");
    try {
      await loginConGoogle(idToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se ha podido continuar con Google.");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-lg">
        {/* Cabecera */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-primary">
            <HeartPulse className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Crear cuenta</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Únete a Cuidados Hospitalarios
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card p-6 shadow-float space-y-5"
        >
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <GoogleLoginButton onCredential={handleGoogleCredential} />

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o continúa con email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Nombre y apellidos */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FloatingInput
              id="nombre"
              type="text"
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
            />
            <FloatingInput
              id="apellidos"
              type="text"
              label="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              autoComplete="family-name"
            />
          </div>

          {/* Email */}
          <FloatingInput
            id="reg-email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {/* Teléfono */}
          <FloatingInput
            id="telefono"
            type="tel"
            label={<>Teléfono <span className="text-muted-foreground">(opcional)</span></>}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
          />

          {/* Contraseña */}
          <div className="space-y-1.5">
            <FloatingInput
              id="reg-password"
              type={showPassword ? "text" : "password"}
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
            {password.length > 0 && (
              <ul className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2">
                {REQUISITOS_PASSWORD.map((req) => {
                  const cumple = req.cumple(password);
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

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <FloatingInput
              id="reg-confirm"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {confirmPassword.length > 0 && (
              <p
                className={`flex items-center gap-1.5 text-xs ${
                  password === confirmPassword
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {password === confirmPassword ? (
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

          {/* Términos */}
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary" />
            <span>
              Acepto los{" "}
              <Link href="/legal/aviso" className="text-primary hover:underline">Términos y condiciones</Link>
              {" "}y la{" "}
              <Link href="/legal/privacidad" className="text-primary hover:underline">Política de privacidad</Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            ¿Quieres ofrecer tus servicios como cuidador? Podrás activarlo desde tu perfil después de registrarte.
          </p>
        </form>

        {/* Enlace a login */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
