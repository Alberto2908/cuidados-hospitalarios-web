"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuth } from "@/lib/auth/AuthContext";

type Vista = "anuncios" | "cuidadores";

const RUTAS: Record<Vista, string> = {
  anuncios: "/cuidador/buscar",
  cuidadores: "/paciente/buscar",
};

const CLAVE_VISTA_ANTERIOR = "buscador-vista";

function leerVistaAnterior(): Vista | null {
  try {
    const v = sessionStorage.getItem(CLAVE_VISTA_ANTERIOR);
    return v === "anuncios" || v === "cuidadores" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Selector del buscador compartido: el cuidador alterna entre buscar anuncios y
 * buscar cuidadores. Cada vista es una ruta distinta, asi que el componente se
 * monta de nuevo al cambiar; para que el indicador se deslice en vez de saltar,
 * arranca en la vista de la que se viene (guardada por pestana) y pasa a la
 * activa justo despues de montarse. Un paciente no lo ve: solo tiene la
 * busqueda de cuidadores.
 */
export default function SelectorBuscador({ activo }: { activo: Vista }) {
  const router = useRouter();
  const { user } = useAuth();
  const [mostrada, setMostrada] = useState<Vista>(() => (typeof window === "undefined" ? activo : leerVistaAnterior() ?? activo));

  useEffect(() => {
    const id = requestAnimationFrame(() => setMostrada(activo));
    try {
      sessionStorage.setItem(CLAVE_VISTA_ANTERIOR, activo);
    } catch {
      // sessionStorage no disponible: el indicador simplemente no se desliza
    }
    return () => cancelAnimationFrame(id);
  }, [activo]);

  if (user?.rol !== "CUIDADOR") return null;

  return (
    <SegmentedControl<Vista>
      ariaLabel="Qué quieres buscar"
      value={mostrada}
      onChange={(vista) => {
        if (vista !== activo) router.push(RUTAS[vista]);
      }}
      options={[
        { value: "anuncios", label: "Buscar anuncios" },
        { value: "cuidadores", label: "Buscar cuidadores" },
      ]}
    />
  );
}
