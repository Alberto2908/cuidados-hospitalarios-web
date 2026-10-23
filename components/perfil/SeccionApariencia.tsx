"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { SegmentedControl } from "@/components/ui/segmented-control";

const OPCIONES = [
  { valor: "system", api: "SYSTEM", etiqueta: "Sistema", icono: Monitor },
  { valor: "light", api: "LIGHT", etiqueta: "Claro", icono: Sun },
  { valor: "dark", api: "DARK", etiqueta: "Oscuro", icono: Moon },
] as const;

// Igual que la transicion de SegmentedControl (duration-300).
const DURACION_DESLIZAMIENTO_MS = 320;

type ValorTema = (typeof OPCIONES)[number]["valor"];

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
  // La pastilla se mueve al instante y el tema cambia cuando termina el deslizamiento:
  // next-themes desactiva las transiciones al cambiar de tema y, si cambiara a la vez,
  // la pastilla saltaria sin animar.
  const [elegido, setElegido] = useState<ValorTema | null>(null);

  function elegir(valor: ValorTema) {
    if (valor === (elegido ?? actual)) return;
    setElegido(valor);
    setTimeout(() => {
      setTheme(valor);
      // Si falla el guardado se queda la preferencia local (localStorage) sin molestar al usuario.
      actualizarTema(OPCIONES.find((o) => o.valor === valor)!.api).catch(() => {});
      setElegido(null);
    }, DURACION_DESLIZAMIENTO_MS);
  }

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

      {/* key: al montar en cliente el valor pasa de "system" al guardado; se remonta para que no se vea deslizar. */}
      <SegmentedControl
        key={montado ? "montado" : "ssr"}
        tipo="radio"
        ariaLabel="Tema de la interfaz"
        className="grid w-full bg-muted shadow-none"
        value={(elegido ?? actual) as ValorTema}
        onChange={elegir}
        options={OPCIONES.map(({ valor, etiqueta, icono: Icono }) => ({
          value: valor,
          label: etiqueta,
          icon: <Icono className="h-4 w-4" />,
        }))}
      />
    </div>
  );
}
