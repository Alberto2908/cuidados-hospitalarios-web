"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth/AuthContext";
import { HeartPulse, Eye, EyeOff, UserRound, Stethoscope } from "lucide-react";

const ROLES: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "PACIENTE",
    label: "Paciente / Familia",
    desc: "Busco un cuidador para mí o un familiar",
    icon: <UserRound className="h-5 w-5" />,
  },
  {
    value: "CUIDADOR",
    label: "Cuidador profesional",
    desc: "Ofrezco mis servicios como cuidador",
    icon: <Stethoscope className="h-5 w-5" />,
  },
];

export default function RegistroPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre || !apellido || !email || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (!role) {
      setError("Selecciona un rol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    login(role);
    router.push("/");
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-lg">
        {/* Cabecera */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
            <HeartPulse className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Únete a Cuidados Hospitalarios
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-5"
        >
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Selector de rol */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">¿Qué quieres hacer?</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    role === r.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <div className={`mt-0.5 ${role === r.value ? "text-primary" : "text-muted-foreground"}`}>
                    {r.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${role === r.value ? "text-primary" : "text-foreground"}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre y apellido */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="text-sm font-medium text-foreground">Nombre</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="María"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2 transition-shadow"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="apellido" className="text-sm font-medium text-foreground">Apellido</label>
              <input
                id="apellido"
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="García"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2 transition-shadow"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2 transition-shadow"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="text-sm font-medium text-foreground">Contraseña</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2 transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="reg-confirm" className="text-sm font-medium text-foreground">Confirmar contraseña</label>
            <input
              id="reg-confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2 transition-shadow"
            />
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
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Crear cuenta
          </button>
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
