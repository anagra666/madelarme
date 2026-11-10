"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useFinePointer } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface PreviewItem {
  slug: string;
  /** постер лупа формата; нет лупа — вместо кадра титр с label */
  src?: string;
  alt: string;
  /** текст титра-заглушки: термин формата («music video») */
  label: string;
}

/**
 * Кадр 320×180, плывущий за курсором внутри списка форматов (только pointer: fine).
 * Слушает pointer-события на родительском элементе; строки помечены data-format="slug".
 * Двигается только transform — без перерисовок React на каждое движение.
 * У формата без лупа (нет работ) — не пустая плашка, а титр: термин дисплеем на чернилах.
 */
export default function FormatsPreview({ items }: { items: PreviewItem[] }) {
  const fine = useFinePointer();
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!fine) return;
    const el = frame.current;
    const host = el?.parentElement;
    if (!el || !host) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let running = false;

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) raf = requestAnimationFrame(tick);
      else running = false;
    };
    const run = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = e.clientX - r.left + 28;
      ty = e.clientY - r.top - 90;
      // не вылезать за правый край секции
      const maxX = r.width - 320 - 8;
      if (tx > maxX) tx = e.clientX - r.left - 320 - 28;
      run();
    };
    const onOver = (e: PointerEvent) => {
      const row = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-format]");
      setActive(row?.dataset.format ?? null);
    };
    const onLeave = () => setActive(null);

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerover", onOver);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerover", onOver);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div
      ref={frame}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[180px] w-[320px] will-change-transform lg:block"
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-ink transition-[opacity,transform] duration-300 ease-out-expo",
          active ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
      >
        {items.map((it) => {
          const shown = active === it.slug ? "opacity-100" : "opacity-0";
          return it.src ? (
            <Image
              key={it.slug}
              src={it.src}
              alt={it.alt}
              fill
              sizes="320px"
              className={cn("object-cover transition-opacity duration-200", shown)}
            />
          ) : (
            <span
              key={it.slug}
              className={cn(
                "disp absolute inset-0 grid place-items-center px-6 pb-6 text-center text-[44px] leading-[.86] text-paper [text-wrap:balance] transition-opacity duration-200",
                shown,
              )}
            >
              {it.label}
            </span>
          );
        })}
        <span className="mono-sm absolute bottom-2 left-2 text-paper">
          {items.find((i) => i.slug === active)?.alt ?? ""}
        </span>
      </div>
    </div>
  );
}
