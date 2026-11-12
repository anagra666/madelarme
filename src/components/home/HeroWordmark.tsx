"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { settings } from "@/lib/settings";
import { useFinePointer, useMediaQuery } from "@/lib/hooks";

/** Подпись hero живёт только на десктопе с мышью и без reduced-motion. */
function useSignature(): boolean {
  const fine = useFinePointer();
  const desk = useMediaQuery("(min-width: 1024px)");
  const reduce = useReducedMotion();
  return fine && desk && !reduce;
}

/** Прогресс 0→1 за первые 120vh скролла окна (hero стоит первым на странице). */
function useHeroProgress() {
  const { scrollY } = useScroll();
  const vh = useMotionValue(0);
  useEffect(() => {
    const on = () => vh.set(window.innerHeight);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [vh]);
  return useTransform(() => {
    const h = vh.get() || 1;
    return Math.min(1, Math.max(0, scrollY.get() / (1.2 * h)));
  });
}

const HEADER_LINE = 22; // px — высота вордмарка в слоте шапки
const DOCK_GAP = 12; // px — зазор от монограммы «M.» до севшего вордмарка

/**
 * Гигантский MADELARME поверх видео (mix-blend: difference). При первом скролле
 * уезжает в слот шапки (только transform/opacity), H1 в это время гаснет (HeroFade).
 */
export default function HeroWordmark() {
  const on = useSignature();
  const p = useHeroProgress();
  const wrap = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const endX = useMotionValue(0);
  const endY = useMotionValue(0);
  const endS = useMotionValue(1);

  useLayoutEffect(() => {
    if (!on) return;
    const measure = () => {
      const w = wrap.current, t = text.current;
      if (!w || !t) return;
      const wr = w.getBoundingClientRect();
      const gutter = parseFloat(getComputedStyle(w).paddingLeft) || 16;
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
      /* садимся справа от монограммы, а не на неё: иначе «M.» и MADELARME ложатся друг на друга */
      const logo = document.querySelector<HTMLElement>('header a[href="/"]');
      const dockX = logo ? logo.getBoundingClientRect().right + DOCK_GAP : gutter;
      endS.set(HEADER_LINE / t.offsetHeight);
      endX.set(dockX - (wr.left + t.offsetLeft));
      endY.set((headerH - HEADER_LINE) / 2 - (wr.top + t.offsetTop));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [on, endX, endY, endS]);

  const transform = useTransform(() => {
    const v = p.get();
    const e = 1 - (1 - v) * (1 - v); // ease-out
    return `translate3d(${e * endX.get()}px, ${e * endY.get()}px, 0) scale(${1 + e * (endS.get() - 1)})`;
  });
  const opacity = useTransform(p, [0, 0.8, 1], [1, 1, 0]);
  const display = useTransform(p, (v) => (v >= 1 ? "none" : "block"));

  if (!on) return null;
  /* Верхняя треть экрана: под шапкой и моно-строкой, над H1 (§05 — вордмарк → H1 → подпись + CTA).
     Обёртка на весь вьюпорт (не top-[11vh]): иначе overflow-hidden срезает текст, когда он улетает вверх в слот шапки.
     z-45: над шапкой (z-40, bg-ink/80 + blur закрывал «посадку»), но под меню (z-50) и панелью контактов (z-60). */
  return (
    <div ref={wrap} className="pointer-events-none fixed inset-0 z-45 flex items-start justify-center overflow-hidden px-gutter pt-[max(11vh,calc(var(--header-h)+40px))]" aria-hidden="true">
      <motion.div
        ref={text}
        style={{ transform, opacity, display, transformOrigin: "0 0" }}
        className="disp whitespace-nowrap text-[length:min(17vw,28svh)] text-milk mix-blend-difference will-change-transform"
      >
        {settings.brand.wordmark}
      </motion.div>
    </div>
  );
}

/**
 * Блок H1/CTA гаснет, пока вордмарк уезжает в шапку. Вне десктопа — просто дети.
 * Погасший блок нельзя нажать и он не в порядке табуляции: pointer-events/visibility
 * считаются от того же прогресса, что и opacity (opacity 0 сама по себе кликабельна).
 */
export function HeroFade({ children, className }: { children: ReactNode; className?: string }) {
  const on = useSignature();
  const p = useHeroProgress();
  const opacity = useTransform(p, [0, 0.15], [1, 0]);
  const pointerEvents = useTransform(p, (v) => (v > 0.15 ? "none" : "auto"));
  const visibility = useTransform(p, (v) => (v > 0.15 ? "hidden" : "visible"));
  return (
    <motion.div style={on ? { opacity, pointerEvents, visibility } : undefined} className={className}>
      {children}
    </motion.div>
  );
}
