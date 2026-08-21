"use client";

import { useEffect } from "react";
import { Toaster } from "sileo";

const SILEO_WIDTH = 350;
const BODY_MIN = 120;
const BODY_PAD = 8;

/**
 * Sileo fija el body SVG a 350px. Medimos la descripción y estrechos
 * el rectángulo hacia la derecha para que no quede hueco vacío.
 */
function useSileoBodyFit() {
  useEffect(() => {
    const observed = new WeakSet<Element>();
    let raf = 0;

    const syncToast = (toast: Element) => {
      const el = toast as HTMLElement;
      const desc = el.querySelector("[data-sileo-description]");
      const pill = el.querySelector("[data-sileo-pill]");
      const body = el.querySelector("[data-sileo-body]");

      if (!desc || !body) {
        if (el.style.getPropertyValue("--sileo-body-w")) {
          el.style.removeProperty("--sileo-body-w");
          el.style.removeProperty("--sileo-body-x");
        }
        return;
      }

      const descVisible =
        getComputedStyle(desc).opacity !== "0" &&
        (desc as HTMLElement).offsetHeight > 4;

      if (!descVisible) {
        if (el.style.getPropertyValue("--sileo-body-w")) {
          el.style.removeProperty("--sileo-body-w");
          el.style.removeProperty("--sileo-body-x");
        }
        return;
      }

      const descW = Math.ceil(desc.getBoundingClientRect().width);
      const pillW = pill
        ? Math.ceil(pill.getBoundingClientRect().width)
        : BODY_MIN;
      const width = Math.min(
        SILEO_WIDTH,
        Math.max(descW + BODY_PAD, pillW, BODY_MIN),
      );
      const x = Math.max(0, SILEO_WIDTH - width);
      const nextW = `${width}px`;
      const nextX = `${x}px`;

      if (el.style.getPropertyValue("--sileo-body-w") !== nextW) {
        el.style.setProperty("--sileo-body-w", nextW);
      }
      if (el.style.getPropertyValue("--sileo-body-x") !== nextX) {
        el.style.setProperty("--sileo-body-x", nextX);
      }
    };

    const syncAll = () => {
      document
        .querySelectorAll("[data-sileo-toast]")
        .forEach((toast) => syncToast(toast));
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncAll);
    };

    const ro = new ResizeObserver(schedule);

    const watch = (root: ParentNode) => {
      root.querySelectorAll("[data-sileo-toast]").forEach((toast) => {
        if (!observed.has(toast)) {
          observed.add(toast);
          ro.observe(toast);
        }
        const desc = toast.querySelector("[data-sileo-description]");
        if (desc && !observed.has(desc)) {
          observed.add(desc);
          ro.observe(desc);
        }
      });
    };

    const mo = new MutationObserver(() => {
      watch(document.body);
      schedule();
    });

    mo.observe(document.body, { childList: true, subtree: true });
    watch(document.body);
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
    };
  }, []);
}

/**
 * theme="light" → fill oscuro (#1a1a1a), contraste sobre fondos blancos.
 * --sileo-width permanece 350px (morph); el body se ajusta vía CSS vars.
 */
export default function AppToaster() {
  useSileoBodyFit();

  return (
    <Toaster
      position="top-right"
      theme="light"
      offset={{ top: 88, right: 24 }}
    />
  );
}
