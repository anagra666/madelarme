"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Still } from "@/content/types";
import { useScrollLock } from "@/lib/hooks";
import { Eyebrow } from "@/components/ui/Section";
import { cn, pad2 } from "@/lib/utils";
import { useFocusTrap } from "@/components/layout/ContactPanel";
import { emitOverlay } from "@/components/layout/StickyCTA";

/**
 * Кадры кейса: masonry в 2/3 колонки (CSS columns), у каждого бокса aspect-ratio из w/h (CLS 0) —
 * кадры разных пропорций встают друг под другом без дыр.
 * Тап — простой лайтбокс: Esc / клик по фону закрывает, ← → листают, Tab по кругу, фокус возвращается (useFocusTrap).
 */
export default function Stills({ stills, title }: { stills: Still[]; title: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = idx !== null;
  useScrollLock(open);

  const close = useCallback(() => setIdx(null), []);
  const step = useCallback(
    (d: number) => setIdx((i) => (i === null ? i : (i + d + stills.length) % stills.length)),
    [stills.length],
  );

  /* Esc, Tab по кругу, фокус на крестик (data-autofocus) и возврат на нажатый кадр */
  useFocusTrap(dialogRef, open, close, () => restoreRef.current);

  /* ← → листают */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, step]);

  /* шина оверлеев: только пока открыт, один emit на открытие и один на закрытие */
  useEffect(() => {
    if (!open) return;
    emitOverlay(true);
    return () => emitOverlay(false);
  }, [open]);

  const cur = idx !== null ? stills[idx] : null;

  return (
    <section className="border-t border-rule px-gutter py-10 lg:py-16" aria-label={`Кадры — ${title}`}>
      <div className="mb-5 flex items-baseline justify-between">
        <Eyebrow>[ Кадры ]</Eyebrow>
        <span className="mono text-meta">{stills.length} шт.</span>
      </div>

      {/* колонок не больше, чем кадров: при двух кадрах на десктопе третья колонка стояла бы пустой */}
      <ul className={cn("gap-2 lg:gap-4", stills.length === 1 ? "columns-1" : "columns-2", stills.length > 2 && "lg:columns-3")}>
        {stills.map((s, i) => (
          <li key={s.src} className="mb-2 break-inside-avoid lg:mb-4">
            <button
              type="button"
              onClick={(e) => {
                restoreRef.current = e.currentTarget;
                setIdx(i);
              }}
              aria-label={`Открыть кадр ${i + 1}: ${s.alt}`}
              className="group relative block w-full overflow-hidden bg-ink-2"
              style={{ aspectRatio: `${s.w} / ${s.h}` }}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover opacity-85 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="mono-sm absolute bottom-2 left-2 text-milk/70 opacity-0 transition-opacity group-hover:opacity-100">
                {pad2(i + 1)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* портал: над шапкой и вне stacking-context секции */}
      {open && cur && createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Кадр ${idx! + 1} из ${stills.length}`}
          className="fixed inset-0 z-50 flex flex-col bg-ink"
          onClick={close}
          data-lenis-prevent
        >
          <div className="flex min-h-14 shrink-0 items-center justify-between pl-gutter pr-2" onClick={(e) => e.stopPropagation()}>
            <span className="mono text-milk">
              [ {pad2(idx! + 1)} / {pad2(stills.length)} ]{cur.caption && <span className="text-meta"> · {cur.caption}</span>}
            </span>
            <button
              type="button"
              data-autofocus
              onClick={close}
              aria-label="Закрыть"
              className="grid h-11 w-11 place-items-center text-milk hover:text-signal"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Image
              key={cur.src}
              src={cur.src}
              alt={cur.alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {stills.length > 1 && (
            <div className="flex min-h-14 shrink-0 items-center justify-between px-2 pb-[env(safe-area-inset-bottom)]" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Предыдущий кадр"
                className="mono flex h-11 items-center gap-2 px-3 text-milk hover:text-signal"
              >
                <ChevronLeft size={18} strokeWidth={1.5} /> пред.
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Следующий кадр"
                className="mono flex h-11 items-center gap-2 px-3 text-milk hover:text-signal"
              >
                след. <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </section>
  );
}
