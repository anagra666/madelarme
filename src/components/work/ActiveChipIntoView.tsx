"use client";

import { useEffect, useRef } from "react";

/**
 * Лист внутри <nav> фильтров: на телефоне чипы — горизонтальный rail, и активный чип из расшаренной
 * ссылки (?format=aftermovie) оказывается за краем экрана. Центруем каждый активный чип в его ленте.
 * Крутим только scrollLeft самой ленты — страница по вертикали не двигается (в отличие от scrollIntoView).
 */
export default function ActiveChipIntoView({ deps }: { deps: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const nav = ref.current?.closest("nav");
    if (!nav) return;
    nav.querySelectorAll<HTMLElement>('a[aria-current="true"]').forEach((chip) => {
      const rail = chip.parentElement;
      if (!rail || rail.scrollWidth <= rail.clientWidth) return; // десктоп: строки переносятся, крутить нечего
      const c = chip.getBoundingClientRect();
      const r = rail.getBoundingClientRect();
      const left = rail.scrollLeft + (c.left + c.width / 2) - (r.left + r.width / 2);
      rail.scrollTo({ left, behavior: first.current ? "auto" : "smooth" });
    });
    first.current = false;
  }, [deps]);

  return <span ref={ref} hidden />;
}
