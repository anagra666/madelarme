"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { settings } from "@/lib/settings";
import { igDmLink, tgLink, waLink } from "@/lib/links";
import { useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Line } from "@/components/ui/Reveal";
import {
  AlmatyClock, emitOverlay, InstagramGlyph, TelegramGlyph, useStickyPrefill, WhatsAppGlyph,
} from "@/components/layout/StickyCTA";
import { useFocusTrap } from "@/components/layout/ContactPanel";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Счётчики для подписей пунктов — считаются на сервере (layout.tsx) и приходят через Header. */
export type MenuCounts = { works: number; formats: number; collections: number };

/** 5 пунктов + счётчики */
function items(c: MenuCounts) {
  return [
    { href: "/work", label: "Работы", sub: `работы (${c.works})` },
    { href: "/formats", label: "Форматы", sub: `форматы (${c.formats})` },
    { href: "/pricing", label: "Цены", sub: `коллекции (${c.collections})` },
    { href: "/about", label: "Маша", sub: settings.brand.city.toLowerCase() },
    { href: "/contact", label: "Контакты", sub: "проверить дату" },
  ];
}

export function LangRow({ className }: { className?: string }) {
  return (
    <div className={cn("mono flex items-center gap-4", className)} aria-label="Язык">
      <span aria-current="true" className="text-milk">RU</span>
      <span aria-disabled="true" title="скоро" className="text-meta/60 cursor-not-allowed">KZ</span>
      <span aria-disabled="true" title="скоро" className="text-meta/60 cursor-not-allowed">EN</span>
    </div>
  );
}

export default function MenuOverlay({
  open,
  onClose,
  triggerRef,
  counts,
}: {
  open: boolean;
  onClose: () => void;
  /** кнопка «МЕНЮ» — сюда возвращается фокус */
  triggerRef?: RefObject<HTMLElement | null>;
  counts: MenuCounts;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const text = useStickyPrefill();

  useScrollLock(open);
  useFocusTrap(ref, open, onClose, () => triggerRef?.current ?? null);
  useEffect(() => { if (open) { emitOverlay(true); return () => emitOverlay(false); } }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          data-lenis-prevent
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-ink text-milk"
        >
          {/* grain задаёт position:relative, поэтому живёт на отдельном слое */}
          <div aria-hidden="true" className="grain pointer-events-none inset-0" style={{ position: "absolute" }} />
          {/* верх: монограмма + закрыть (44px) — на месте кнопки МЕНЮ */}
          <div className="relative z-2 flex h-(--header-h) shrink-0 items-center justify-between px-gutter">
            <Link href="/" prefetch={false} onClick={onClose} className="disp -ml-1 flex h-11 min-w-11 items-center px-1 text-[28px] leading-none" aria-label="На главную">
              {settings.brand.monogram}
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть меню"
              className="mono -mr-3 flex h-11 min-w-11 items-center justify-center gap-2 px-3 text-milk transition-colors hover:text-signal"
            >
              закрыть <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* пункты */}
          <motion.nav
            aria-label="Разделы"
            className="relative z-2 flex flex-1 flex-col justify-center px-gutter py-6"
            initial={reduce ? "show" : "hidden"}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } }}
          >
            <ul className="flex flex-col">
              {items(counts).map((it, i) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.href} className="border-b border-rule last:border-b-0">
                    <Line>
                      <Link
                        href={it.href}
                        onClick={onClose}
                        data-autofocus={i === 0 ? "" : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex flex-col py-3 transition-colors hover:text-signal lg:flex-row lg:items-end lg:justify-between lg:gap-6",
                          active && "text-signal",
                        )}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className="mono-sm whitespace-nowrap text-meta">[ 0{i + 1} ]</span>
                          <span className="disp whitespace-nowrap text-[18vw] lg:text-[clamp(64px,8vw,128px)]">{it.label}</span>
                        </span>
                        <span className="mono whitespace-nowrap pl-12 text-meta group-hover:text-signal lg:pb-2 lg:pl-0">{it.sub}</span>
                      </Link>
                    </Line>
                  </li>
                );
              })}
            </ul>
          </motion.nav>

          {/* низ: мессенджеры, статус, языки */}
          <motion.div
            className="relative z-2 shrink-0 border-t border-rule px-gutter pb-[calc(24px+env(safe-area-inset-bottom))] pt-5"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
          >
            <div className="grid grid-cols-3 gap-px border border-rule bg-rule">
              <a href={waLink(text)} target="_blank" rel="noopener" className="mono flex h-14 items-center justify-center gap-2 bg-signal font-medium text-ink transition-colors hover:bg-milk">
                <WhatsAppGlyph /> <span className="mono-sm">WhatsApp</span>
              </a>
              <a href={tgLink(text)} target="_blank" rel="noopener" className="mono flex h-14 items-center justify-center gap-2 bg-ink transition-colors hover:text-signal">
                <TelegramGlyph /> <span className="mono-sm">Telegram</span>
              </a>
              <a href={igDmLink()} target="_blank" rel="noopener" className="mono flex h-14 items-center justify-center gap-2 bg-ink transition-colors hover:text-signal">
                <InstagramGlyph /> <span className="mono-sm">Instagram</span>
              </a>
            </div>
            <div className="mono mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-meta">
              <p className="dots">
                <span>{settings.brand.city}</span>
                <span><AlmatyClock className="text-milk" /></span>
                <span>{settings.season}</span>
              </p>
              <LangRow />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
