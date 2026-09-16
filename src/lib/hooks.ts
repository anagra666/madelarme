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

/** Блокировка скролла под оверлеями (меню, плеер, story) */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => { document.documentElement.style.overflow = prev; document.documentElement.classList.remove("lenis-stopped"); };
  }, [locked]);
}
