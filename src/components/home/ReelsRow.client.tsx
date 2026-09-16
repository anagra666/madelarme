"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Reel } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { useReelsStory } from "@/components/media/ReelsStory";
import { useFinePointer } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Десктоп: ряд едет влево при скролле (только transform, только pointer: fine). Телефон: без эффекта.
 * Статичная обёртка режет горизонтальный вылет сдвинутого ряда (overflow-x: clip — без скролл-контейнера,
 * фокус-кольца по вертикали не обрезаются); на телефоне внутри живёт свой rail.
 */
export function ReelsTrack({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, (v) => `${-v * 28}vw`);
  return (
    <div className={cn("overflow-x-clip", className)}>
      <motion.div ref={ref} style={fine && !reduce ? { x } : undefined}>
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
