"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { Reel } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { useScrollLock } from "@/lib/hooks";

/* ── store: открыть story с любой страницы ─────────────────────────────── */
type StoryState = { open: boolean; index: number };
const SERVER: StoryState = { open: false, index: 0 };
let state: StoryState = SERVER;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};
function openStory(index = 0) { state = { open: true, index }; emit(); }
function closeStory() { if (!state.open) return; state = { ...state, open: false }; emit(); }

/** { open(index), close(), isOpen, index } — работает только при смонтированном <ReelsStoryHost/> */
export function useReelsStory() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);
  return { open: openStory, close: closeStory, isOpen: s.open, index: s.index };
}

/** Монтировать ОДИН раз (page.tsx / layout.tsx): <ReelsStoryHost reels={getReels()} /> */
export function ReelsStoryHost({ reels }: { reels: Reel[] }) {
  const { isOpen, index } = useReelsStory();
  return (
    <AnimatePresence>
      {isOpen && reels.length > 0 && (
        <ReelsStory key="story" reels={reels} index={Math.min(index, reels.length - 1)} onClose={closeStory} />
      )}
    </AnimatePresence>
  );
}

/* ── оверлей ───────────────────────────────────────────────────────────── */
export default function ReelsStory({ reels, index, onClose }: { reels: Reel[]; index: number; onClose: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchY = useRef<number | null>(null);
  const [current, setCurrent] = useState(index);
  useScrollLock(true);

  /* событие для StickyCTA + фокус: на кнопку закрытия, назад при закрытии */
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    window.dispatchEvent(new CustomEvent("madelarme:overlay", { detail: { open: true } }));
    closeBtn.current?.focus();
    return () => {
      window.dispatchEvent(new CustomEvent("madelarme:overlay", { detail: { open: false } }));
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* стартовая позиция — до первой отрисовки, без прыжка */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = index * el.clientHeight;
  }, [index]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setCurrent(Math.round(el.scrollTop / el.clientHeight));
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
      className="fixed inset-0 z-100 bg-ink text-milk"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="mono pointer-events-none absolute left-4 z-20 leading-11"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        aria-live="polite"
      >
        {current + 1} / {reels.length}
      </div>
      <button
        ref={closeBtn}
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-3 z-20 grid h-11 w-11 place-items-center border border-milk/40 bg-ink/40 text-milk transition-colors hover:border-milk hover:text-signal"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      <div
        ref={scroller}
        data-lenis-prevent
        onScroll={onScroll}
        onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          const el = scroller.current;
          if (touchY.current == null || !el || el.scrollTop > 0) return;
          if (e.touches[0].clientY - touchY.current > 80) { touchY.current = null; onClose(); }
        }}
        onTouchEnd={() => { touchY.current = null; }}
        className="h-svh snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((r) => <ReelItem key={r.slug} reel={r} />)}
      </div>
    </motion.div>
  );
}

/* ── страничный режим для /reels: та же лента без хрома оверлея ────────── */
export function ReelsFeed({ reels }: { reels: Reel[] }) {
  return (
    <div className="snap-y snap-mandatory">
      {reels.map((r) => <ReelItem key={r.slug} reel={r} badge />)}
    </div>
  );
}

function ReelItem({ reel, badge = false }: { reel: Reel; badge?: boolean }) {
  return (
    <section className="grid h-svh snap-start place-items-center" aria-label={reel.title}>
      <div className="relative h-svh w-full lg:aspect-[9/16] lg:h-[90vh] lg:w-auto lg:border lg:border-rule">
        <CinemaVideo
          loop={reel.loop}
          mode="visible"
          orientation="v"
          className="absolute inset-0"
          sizes="(min-width: 1024px) 50vh, 100vw"
        />
        <div className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-1/2" aria-hidden="true" />
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        >
          <div className="min-w-0">
            {badge && reel.isPlaceholder && (
              <span className="mono-sm inline-block border border-meta/60 px-1.5 py-0.5 text-meta">ДЕМО-КОНТЕНТ</span>
            )}
            <h3 className="disp mt-2 text-[clamp(28px,7vw,44px)]">{reel.title}</h3>
            {reel.caption && <p className="mono mt-2 text-meta">{reel.caption}</p>}
            {reel.caseSlug && (
              <Link href={`/work/${reel.caseSlug}`} className="mono mt-1 inline-flex h-11 items-center text-milk transition-colors hover:text-signal">
                смотреть кейс →
              </Link>
            )}
          </div>
          <button
            type="button"
            disabled
            title="демо без звука"
            aria-label="Звук выключен — демо без звука"
            className="mono grid h-11 shrink-0 place-items-center border border-milk/40 bg-ink/40 px-3 text-milk disabled:opacity-60"
          >
            ЗВУК: ВЫКЛ
          </button>
        </div>
      </div>
    </section>
  );
}
