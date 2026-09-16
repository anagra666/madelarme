"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/utils";

/** Lenis только на устройствах с мышью; на тач — нативный скролл (scroll-snap и «назад» в Safari). */
export default function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    (window as unknown as { lenis?: Lenis }).lenis = lenis;
    return () => { cancelAnimationFrame(raf); lenis.destroy(); delete (window as unknown as { lenis?: Lenis }).lenis; };
  }, []);
  return null;
}
