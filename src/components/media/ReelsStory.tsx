"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { Reel } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { useFocusTrap } from "@/components/layout/ContactPanel";
import { emitOverlay } from "@/components/layout/StickyCTA";
import { useScrollLock } from "@/lib/hooks";
import { cn, pad2 } from "@/lib/utils";

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

/** Монтировать ОДИН раз (layout.tsx): <ReelsStoryHost reels={getReels()} /> */
export function ReelsStoryHost({ reels }: { reels: Reel[] }) {
  const { isOpen, index } = useReelsStory();
  /* переход по «смотреть кейс →» или «назад» в браузере меняет маршрут — story не должна висеть поверх новой страницы */
  const pathname = usePathname();
  useEffect(() => { closeStory(); }, [pathname]);
  return (
    <AnimatePresence>
      {isOpen && reels.length > 0 && (
        <ReelsStory key="story" reels={reels} index={Math.min(index, reels.length - 1)} onClose={closeStory} />
      )}
    </AnimatePresence>
  );
}

/* ── общее для оверлея и страницы: шаг ленты и клавиатура ──────────────── */
/* высоту задаёт вызывающий: оверлей — h-svh, страница — svh минус шапка (под ней распорка) */
const SCROLLER_CLASS =
  "snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

type Scroller = RefObject<HTMLDivElement | null>;

function stepFeed(scroller: Scroller, dir: 1 | -1) {
  const el = scroller.current;
  el?.scrollBy({ top: dir * el.clientHeight, behavior: "smooth" });
}

/** ↓ / PageDown — следующий reel, ↑ / PageUp — предыдущий (шаг = высота ленты, снап доводит) */
function feedKeys(e: KeyboardEvent, scroller: Scroller) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); stepFeed(scroller, 1); }
  else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); stepFeed(scroller, -1); }
}

/** Текущий индекс ленты по IntersectionObserver над её секциями (root — сам скроллер) */
function useFeedIndex(scroller: Scroller, count: number, initial = 0) {
  const [current, setCurrent] = useState(initial);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const items = Array.from(root.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (list) => {
        /* isIntersecting истинно и при касании края (ratio 0) — считаем только ≥60% видимости */
        for (const x of list) {
          if (x.intersectionRatio >= 0.6) setCurrent(items.indexOf(x.target as HTMLElement));
        }
      },
      { root, threshold: 0.6 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scroller, count]);
  return Math.max(0, Math.min(current, count - 1));
}

/* ── оверлей ───────────────────────────────────────────────────────────── */
export default function ReelsStory({ reels, index, onClose }: { reels: Reel[]; index: number; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const touchY = useRef<number | null>(null);
  const current = useFeedIndex(scroller, reels.length, index);
  useScrollLock(true);

  /* фокус: на кнопку закрытия (data-autofocus), Tab по кругу, Esc → onClose, возврат фокуса на триггер */
  useFocusTrap(root, true, onClose);
  /* StickyCTA: ровно один emit на открытие и один на закрытие (компонент живёт только пока открыт) */
  useEffect(() => { emitOverlay(true); return () => emitOverlay(false); }, []);

  /* стартовая позиция — до первой отрисовки, без прыжка */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = index * el.clientHeight;
  }, [index]);

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
      onKeyDown={(e) => feedKeys(e, scroller)}
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
        {pad2(current + 1)} / {pad2(reels.length)}
      </div>
      <button
        type="button"
        data-autofocus
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-3 z-20 grid h-11 w-11 place-items-center border border-milk/40 bg-ink/40 text-milk transition-colors hover:border-milk hover:text-signal"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      <div
        ref={scroller}
        tabIndex={0}
        aria-label="Лента reels"
        data-lenis-prevent
        onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          const el = scroller.current;
          if (touchY.current == null || !el || el.scrollTop > 0) return;
          if (e.touches[0].clientY - touchY.current > 80) { touchY.current = null; onClose(); }
        }}
        onTouchEnd={() => { touchY.current = null; }}
        className={cn("h-svh", SCROLLER_CLASS)}
      >
        {reels.map((r, i) => <ReelItem key={r.slug} reel={r} priority={i === index} />)}
      </div>
    </motion.div>
  );
}

/* ── страничный режим для /reels: та же лента как собственный скроллер ────
 * Страница ставит распорку --header-h под фиксированной шапкой, поэтому лента = svh − шапка. */
export function ReelsFeed({ reels }: { reels: Reel[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const current = useFeedIndex(scroller, reels.length);
  const arrow =
    "grid h-11 w-11 place-items-center border border-milk/40 bg-ink/40 text-milk transition-colors hover:border-milk hover:text-signal disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="relative h-[calc(100svh-var(--header-h))]">
      {/* счётчик — сразу под шапкой */}
      <div className="mono pointer-events-none absolute left-gutter top-1 z-20 leading-11 text-milk" aria-live="polite">
        {pad2(current + 1)} / {pad2(reels.length)}
      </div>

      {/* десктоп: ↑↓ справа по центру */}
      <div className="absolute right-gutter top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button type="button" aria-label="Предыдущий reel" disabled={current <= 0} onClick={() => stepFeed(scroller, -1)} className={arrow}>
          <ChevronUp size={18} strokeWidth={1.5} />
        </button>
        <button type="button" aria-label="Следующий reel" disabled={current >= reels.length - 1} onClick={() => stepFeed(scroller, 1)} className={arrow}>
          <ChevronDown size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div
        ref={scroller}
        tabIndex={0}
        aria-label="Лента reels"
        data-lenis-prevent
        onKeyDown={(e) => feedKeys(e, scroller)}
        className={cn("h-full", SCROLLER_CLASS)}
      >
        {reels.map((r, i) => <ReelItem key={r.slug} reel={r} badge priority={i === 0} last={i === reels.length - 1} />)}
      </div>
    </div>
  );
}

function ReelItem({ reel, badge = false, last = false, priority = false }: { reel: Reel; badge?: boolean; last?: boolean; priority?: boolean }) {
  /* на странице /reels заголовок reel идёт сразу после sr-only H1 — h2; в оверлее (свой dialog) — h3 */
  const Title = badge ? "h2" : "h3";
  return (
    <section className="grid h-full snap-start place-items-center" aria-label={reel.title}>
      <div className="relative h-full w-full lg:aspect-[9/16] lg:h-[90%] lg:w-auto lg:border lg:border-rule">
        <CinemaVideo
          loop={reel.loop}
          mode="visible"
          orientation="v"
          priority={priority}
          className="absolute inset-0"
          sizes="(min-width: 1024px) 50vh, 100vw"
        />
        {/* скримы: сверху под счётчик «01 / 09», снизу под подпись — кадры бывают почти белыми (платье, студия) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-ink/65 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-b from-transparent via-ink/50 to-ink/85" aria-hidden="true" />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4",
            /* последний экран: запас под мобильный sticky-бар, чтобы подпись не перекрывалась */
            last
              ? "pb-[calc(env(safe-area-inset-bottom)+var(--sticky-h)+16px)] lg:pb-[calc(env(safe-area-inset-bottom)+16px)]"
              : "pb-[calc(env(safe-area-inset-bottom)+16px)]",
          )}
        >
          <div className="min-w-0 flex-1">
            {badge && reel.isPlaceholder && (
              <span className="mono-sm inline-block border border-milk/40 bg-ink/60 px-1.5 py-0.5 text-milk/85">ДЕМО-КОНТЕНТ</span>
            )}
            <Title className="disp mt-2 text-[clamp(28px,7vw,44px)]">{reel.title}</Title>
            {reel.caption && <p className="mono mt-2 text-milk/80">{reel.caption}</p>}
            {reel.caseSlug && (
              <Link href={`/work/${reel.caseSlug}`} className="mono mt-1 inline-flex h-11 items-center text-milk transition-colors hover:text-signal">
                смотреть кейс →
              </Link>
            )}
          </div>
          <button
            type="button"
            disabled
            title="Звук выключен"
            aria-label="Звук выключен"
            className="mono grid h-11 shrink-0 place-items-center border border-milk/40 bg-ink/40 px-3 text-milk disabled:opacity-60"
          >
            ЗВУК: ВЫКЛ
          </button>
        </div>
      </div>
    </section>
  );
}
