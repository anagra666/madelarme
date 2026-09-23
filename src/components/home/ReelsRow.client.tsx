"use client";

import { useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Reel } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { useReelsStory } from "@/components/media/ReelsStory";
import { useFinePointer, useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Десктоп (≥1024, pointer: fine, без reduced-motion): ряд едет влево при скролле (только transform).
 * Сдвиг = реальный вылет ряда за экран (измеряется), и весь путь проходится, пока ряд целиком на экране:
 * от «низ ряда у низа экрана» до «верх ряда на 10% высоты» — последняя плитка и «ВСЕ REELS» успевают доехать.
 * Фокус с клавиатуры (в т. ч. возврат после Esc из story) подвозит плитку к центру — невидимого фокуса нет.
 * Статичная обёртка режет горизонтальный вылет (overflow-x: clip). Вне эффекта (тач, планшет, reduced-motion)
 * ряд — обычный rail с собственной прокруткой (классы ul в ReelsRow.tsx завязаны на те же медиа-условия).
 */
export function ReelsTrack({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const desk = useMediaQuery("(min-width: 1024px)");
  const reduce = useReducedMotion();
  const active = fine && desk && !reduce;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["end end", "start 0.1"] });
  const range = useMotionValue(0);
  const focusX = useMotionValue<number | null>(null);
  const x = useTransform(() => focusX.get() ?? -scrollYProgress.get() * range.get());

  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    /* scrollWidth не учитывает правый padding ряда (px-gutter) — добавляем, чтобы «ВСЕ REELS» не прилипал к краю */
    const measure = () => {
      const row = el.firstElementChild;
      const pad = row ? parseFloat(getComputedStyle(row).paddingRight) || 0 : 0;
      range.set(Math.max(0, el.scrollWidth + pad - el.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active, range]);

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const el = ref.current;
    const t = e.target as HTMLElement;
    if (!active || !el || !t.matches(":focus-visible")) return;
    const r = (t.closest("li") ?? t).getBoundingClientRect();
    const box = el.getBoundingClientRect();
    /* центр плитки без текущего сдвига → сдвиг, ставящий её в центр, в пределах [-range, 0] */
    const center = r.left + r.width / 2 - box.left - x.get();
    focusX.set(Math.min(0, Math.max(-range.get(), box.width / 2 - center)));
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focusX.set(null);
  };

  return (
    <div className={cn("overflow-x-clip", className)}>
      <motion.div ref={ref} style={active ? { x } : undefined} onFocus={onFocus} onBlur={onBlur}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Плитка 9:16. CinemaVideo может рендерить <button> (▶ при блокировке автоплея), поэтому он не
 * вложен в кнопку: кнопка-оверлей лежит рядом, поверх (absolute inset-0 z-10).
 * Десктоп: hover/focus по плитке → цвет + луп (manual, потому что оверлей перехватывает mouseenter).
 * Телефон: visible → автоплей у ближайшей к центру. Клик/тап — story с этого индекса.
 */
export function ReelTile({ reel, index }: { reel: Reel; index: number }) {
  const fine = useFinePointer();
  const { open } = useReelsStory();
  const [on, setOn] = useState(false);
  return (
    <div
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={cn(
        "group relative aspect-[9/16] w-full transition-[filter,transform] duration-500 active:scale-[.98]",
        "lg:grayscale lg:hover:grayscale-0 lg:focus-within:grayscale-0",
      )}
    >
      <CinemaVideo
        loop={reel.loop}
        mode={fine ? "manual" : "visible"}
        playing={fine && on}
        orientation="v"
        className="absolute inset-0"
        sizes="(min-width: 1024px) 14vw, 72vw"
      />
      <span className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-1/3" aria-hidden="true" />
      <span className="mono-sm pointer-events-none absolute bottom-3 left-3 right-3 z-20 truncate text-milk transition-colors group-hover:text-signal group-focus-within:text-signal">
        {reel.title}
      </span>
      <button
        type="button"
        onClick={() => open(index)}
        onFocus={() => setOn(true)}
        onBlur={() => setOn(false)}
        aria-label={`Смотреть reel: ${reel.title}`}
        className="absolute inset-0 z-10 block w-full"
      />
    </div>
  );
}
