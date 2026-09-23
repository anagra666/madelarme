"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string, initial = false): boolean {
  const [m, setM] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

/** true на устройствах с мышью (hover-приёмы, курсор, Lenis) */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine)");
}

/** Живые часы Алматы «18:42» */
export function useAlmatyTime(): string {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return t;
}

type LenisLike = { stop(): void; start(): void };
/* вложенные оверлеи (панель поверх меню) — один общий счётчик, снимаем блокировку с последним */
let locks = 0;
let prevOverflow = "";

/**
 * Блокировка скролла под оверлеями (меню, плеер, story, панель).
 * overflow:hidden останавливает нативный скролл (тач), а Lenis (мышь) крутит window программно —
 * его нужно остановить явно через lenis.stop(), класс на <html> он не читает.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const lenis = (window as unknown as { lenis?: LenisLike }).lenis;
    if (locks++ === 0) {
      prevOverflow = html.style.overflow;
      html.style.overflow = "hidden";
      lenis?.stop();
    }
    return () => {
      if (--locks > 0) return;
      html.style.overflow = prevOverflow;
      (window as unknown as { lenis?: LenisLike }).lenis?.start();
    };
  }, [locked]);
}
