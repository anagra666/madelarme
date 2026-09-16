"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Reel } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { useReelsStory } from "@/components/media/ReelsStory";
import { useFinePointer } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Десктоп: ряд едет влево при скролле (только transform, только pointer: fine). Телефон: без эффекта. */
export function ReelsTrack({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, (v) => `${-v * 28}vw`);
  return (
    <motion.div ref={ref} className={className} style={fine && !reduce ? { x } : undefined}>
      {children}
    </motion.div>
  );
}

/** Плитка 9:16: hover → цвет + луп (десктоп), visible → автоплей (телефон). Клик — story с этого индекса. */
export function ReelTile({ reel, index }: { reel: Reel; index: number }) {
  const fine = useFinePointer();
  const { open } = useReelsStory();
  return (
    <button
      type="button"
      onClick={() => open(index)}
      aria-label={`Смотреть reel: ${reel.title}`}
      className={cn(
        "group relative block aspect-[9/16] w-full text-left transition-[filter,transform] duration-500 active:scale-[.98]",
        "lg:grayscale lg:hover:grayscale-0 lg:focus-visible:grayscale-0",
      )}
    >
      <CinemaVideo
        loop={reel.loop}
        mode={fine ? "hover" : "visible"}
        orientation="v"
        className="absolute inset-0"
        sizes="(min-width: 1024px) 14vw, 72vw"
      />
      <span className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-1/3" aria-hidden="true" />
      <span className="mono-sm pointer-events-none absolute bottom-3 left-3 right-3 z-10 truncate text-milk transition-colors group-hover:text-signal">
        {reel.title}
      </span>
    </button>
  );
}
