"use client";

import { useEffect, useRef } from "react";
import { useAlmatyTime } from "@/lib/hooks";
import { pad2, prefersReducedMotion } from "@/lib/utils";

/** Живые часы Алматы в моно-строке hero. SSR — без времени (никакого mismatch); разделитель задаёт className. */
export function HeroClock({ className }: { className?: string }) {
  const t = useAlmatyTime();
  if (!t) return null;
  return <span className={className}>[ {t} ALMT ]</span>;
}

const FPS = 24;

/**
 * Накамерный OSD (десктоп): ● REC · таймкод реального времени · 4K · 24 FPS · ЗВУК: ВЫКЛ.
 * Таймкод тикает (rAF) только пока OSD на экране: на телефоне он display:none, после hero — вне вьюпорта,
 * IntersectionObserver в обоих случаях говорит «не пересекается». При reduced-motion — статичный, как REC.
 */
export default function HeroOSD() {
  const tc = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = tc.current;
    if (!el || prefersReducedMotion()) return;
    const t0 = performance.now();
    let raf = 0;
    let last = "";
    const tick = (now: number) => {
      const s = (now - t0) / 1000;
      const f = Math.floor((s % 1) * FPS);
      const next = `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(Math.floor(s) % 60)}:${pad2(f)}`;
      if (next !== last) { el.textContent = next; last = next; }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e?.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="mono flex items-center gap-4 text-milk" aria-hidden="true">
      <span className="flex items-center gap-2 text-signal">
        <span className="inline-block h-2 w-2 bg-signal animate-[rec_1s_steps(1)_infinite] motion-reduce:animate-none" />
        REC
      </span>
      <span ref={tc} className="text-milk/85">00:00:00:00</span>
      {/* не text-meta: #8F877D на сером небе ≈1.3:1 — эффект «экрана камеры» пропадал */}
      <span className="text-milk/70">4K · {FPS} FPS</span>
      <span className="text-milk/70">ЗВУК: ВЫКЛ</span>
      <style>{`@keyframes rec{50%{opacity:0}}`}</style>
    </div>
  );
}
