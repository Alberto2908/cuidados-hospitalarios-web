"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Al iniciar sesión (o recargar con sesión), el tema guardado en el perfil
 * manda sobre el de localStorage, que solo hace de caché para pintar sin
 * parpadeo y para las pantallas sin sesión (login, registro).
 */
export default function SincronizarTema() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const tema = user?.tema;

  useEffect(() => {
    if (tema) setTheme(tema.toLowerCase());
  }, [tema, setTheme]);

  return null;
}
