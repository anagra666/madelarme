"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Lenis только на устройствах с мышью; на тач — нативный скролл (scroll-snap и «назад» в Safari).
 * Модуль грузится динамически — на телефонах чанк Lenis не скачивается вовсе.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
    let cancelled = false;
    let lenis: Lenis | null = null;
    let raf = 0;
    /* «назад/вперёд» во время инерции: stop()+start() делают reset(); не трогаем, если скролл заблокирован оверлеем */
    const onPop = () => { if (lenis && !lenis.isStopped) { lenis.stop(); lenis.start(); } };
    import("lenis").then(({ default: LenisCtor }) => {
      if (cancelled) return;
      lenis = new LenisCtor({ lerp: 0.11, wheelMultiplier: 0.95, stopInertiaOnNavigate: true });
      const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
      window.addEventListener("popstate", onPop);
      /* оверлей мог открыться раньше, чем Lenis загрузился */
      if (document.documentElement.style.overflow === "hidden") lenis.stop();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("popstate", onPop);
      lenis?.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, []);
  return null;
}
