"use client";

import { useEffect, useRef } from "react";
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

  // setTheme de next-themes cambia de identidad cada vez que cambia el tema. Si fuera
  // dependencia del efecto, este se repetiria al elegir un tema y reaplicaria el
  // guardado (todavia el anterior) hasta que el servidor responde: el selector rebotaba.
  const setThemeRef = useRef(setTheme);
  useEffect(() => {
    setThemeRef.current = setTheme;
  });

  useEffect(() => {
    if (tema) setThemeRef.current(tema.toLowerCase());
  }, [tema]);

  return null;
}
