"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

interface Medida {
  left: number;
  top: number;
  width: number;
  height: number;
}

function igual(a: Medida | null, b: Medida | null): boolean {
  if (a === null || b === null) return a === b;
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

const DURACION_MS = 300;

/**
 * Indicador que se desliza hasta el elemento activo de una fila de opciones
 * (el fondo de la pastilla del navbar). Mide la posicion real de cada opcion,
 * asi que sirve aunque tengan anchos distintos o cambien de tamano (p. ej. al
 * aparecer una burbuja de notificaciones).
 *
 * Comportamiento:
 *  - al cargar (o la primera vez que hay una activa) aparece en ella creciendo
 *    desde el centro, sin viajar desde ningun sitio;
 *  - al pasar de una opcion a otra, se desliza hasta la nueva;
 *  - si no hay ninguna activa, se encoge y se desvanece donde estaba; cuando se
 *    elige una opcion de nuevo, aparece en ella creciendo desde el centro (no
 *    viaja desde el sitio donde se quedo);
 *  - con "reducir movimiento" activado en el sistema no hay animaciones.
 *
 * Uso:
 *  - `contenedor` como `ref` del elemento padre, que debe tener `position: relative`;
 *  - `registrar(clave)` como `ref` de cada opcion;
 *  - un elemento absoluto con `style={estiloIndicador}`.
 *
 * `clavesItems` debe cambiar cuando cambia el conjunto de opciones (p. ej. al
 * cambiar de rol) para volver a observarlas.
 */
export function useIndicadorDeslizante(claveActiva: string | null, clavesItems: string) {
  const contenedor = useRef<HTMLElement | null>(null);
  const items = useRef(new Map<string, HTMLElement>());
  // Ultima posicion conocida: se conserva mientras esta oculto para encogerse en su sitio.
  const [posicion, setPosicion] = useState<Medida | null>(null);
  const [visible, setVisible] = useState(false);
  // Las transiciones se activan despues de la primera colocacion (la carga no anima).
  const [animar, setAnimar] = useState(false);
  const visibleRef = useRef(false);
  const reducirMovimiento = useRef(false);

  const mostrar = useCallback((valor: boolean) => {
    visibleRef.current = valor;
    setVisible(valor);
  }, []);

  const medir = useCallback(() => {
    const el = claveActiva ? items.current.get(claveActiva) : undefined;
    if (!el) {
      mostrar(false);
      return;
    }
    const nueva = { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
    setPosicion((anterior) => (igual(anterior, nueva) ? anterior : nueva));
    if (!visibleRef.current) {
      // Primera vez, o venia de "ninguna activa": primero se coloca en su sitio
      // (oculto, sin deslizar) y en el siguiente fotograma aparece creciendo ahi
      // mismo desde el centro, en vez de viajar desde la esquina o desde donde estaba.
      requestAnimationFrame(() => mostrar(true));
    }
  }, [claveActiva, mostrar]);

  useLayoutEffect(() => {
    medir();
    const observador = new ResizeObserver(medir);
    if (contenedor.current) observador.observe(contenedor.current);
    items.current.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
    // clavesItems: vuelve a observar las opciones cuando cambia el conjunto.
  }, [medir, clavesItems]);

  useEffect(() => {
    reducirMovimiento.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => setAnimar(!reducirMovimiento.current));
    return () => cancelAnimationFrame(id);
  }, []);

  const registrar = useCallback(
    (clave: string) => (el: HTMLElement | null) => {
      if (el) {
        items.current.set(clave, el);
      } else {
        items.current.delete(clave);
      }
    },
    [],
  );

  // Mientras esta oculto solo se animan opacidad y escala: asi, al reaparecer en
  // otra opcion, la posicion cambia al instante y no se ve un deslizamiento.
  const estiloIndicador: CSSProperties = {
    left: posicion?.left ?? 0,
    top: posicion?.top ?? 0,
    width: posicion?.width ?? 0,
    height: posicion?.height ?? 0,
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.6)",
    transitionProperty: animar ? (visible ? "left, top, width, height, opacity, transform" : "opacity, transform") : "none",
    transitionDuration: `${DURACION_MS}ms`,
    transitionTimingFunction: "ease-out",
  };

  return { contenedor, registrar, estiloIndicador };
}
