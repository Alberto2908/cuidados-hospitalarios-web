"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

const OPCIONES = [
  { valor: "system", api: "SYSTEM", etiqueta: "Sistema", icono: Monitor },
  { valor: "light", api: "LIGHT", etiqueta: "Claro", icono: Sun },
  { valor: "dark", api: "DARK", etiqueta: "Oscuro", icono: Moon },
] as const;

export default function SeccionApariencia() {
  const { theme, setTheme } = useTheme();
  const { actualizarTema } = useAuth();
  // next-themes no conoce el tema hasta montar en cliente; evita mismatch de hidratación.
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const actual = montado ? (theme ?? "system") : "system";

  return (
    <div className="rounded-2xl bg-card p-6 shadow-float">
      <div className="mb-1 flex items-center gap-2 text-foreground">
        <Palette className="h-5 w-5 text-accent-foreground" />
        <h2 className="text-lg font-semibold">Apariencia</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        «Sistema» sigue el modo claro u oscuro de tu dispositivo. Se guarda en tu cuenta y se aplica en
        todos tus dispositivos.
      </p>

      <div
        role="radiogroup"
        aria-label="Tema de la interfaz"
        className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1"
      >
        {OPCIONES.map(({ valor, api, etiqueta, icono: Icono }) => {
          const activo = actual === valor;
          return (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => {
                if (activo) return;
                setTheme(valor);
                // Si falla el guardado se queda la preferencia local (localStorage) sin molestar al usuario.
                actualizarTema(api).catch(() => {});
              }}
              className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                activo
                  ? "bg-primary text-primary-foreground shadow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icono className="h-4 w-4" />
              {etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
