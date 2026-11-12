"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { igDmLink, prefill, tgLink, waLink, type PrefillKind } from "@/lib/links";
import { useAlmatyTime } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════════
   Общие кусочки слоя layout (живут здесь, чтобы не плодить файлы):
   — store предзаполнения WhatsApp (setStickyPrefill / useStickyPrefill)
   — шина оверлеев (emitOverlay / useOverlayOpen), событие 'madelarme:overlay'
   — useScrollDirection
   — глифы мессенджеров (в lucide брендовых иконок нет)
   — AlmatyClock — клиентский лист с живыми часами
   ════════════════════════════════════════════════════════════════════════ */

/* ── prefill store ─────────────────────────────────────────────────────── */
type PrefillState = { kind: PrefillKind; title?: string; path: string | null };
let prefillState: PrefillState = { kind: "home", path: null };
const prefillSubs = new Set<() => void>();
const SERVER_PREFILL: PrefillState = { kind: "home", path: null };

/**
 * Страница вызывает из клиентского листа: setStickyPrefill("case", c.title).
 * Привязывается к текущему pathname — после перехода на другую страницу
 * автоматически возвращается к prefill("home"), сбрасывать вручную не нужно.
 */
export function setStickyPrefill(kind: PrefillKind, title?: string) {
  prefillState = { kind, title, path: typeof location !== "undefined" ? location.pathname : null };
  prefillSubs.forEach((fn) => fn());
}

function subscribePrefill(fn: () => void) {
  prefillSubs.add(fn);
  return () => { prefillSubs.delete(fn); };
}

/** Текущий текст предзаполнения (уже подставленный) для текущей страницы */
export function useStickyPrefill(): string {
  const pathname = usePathname();
  const s = useSyncExternalStore(subscribePrefill, () => prefillState, () => SERVER_PREFILL);
  const active = s.path === pathname ? s : SERVER_PREFILL;
  return prefill(active.kind, active.title);
}

/* ── overlay bus ───────────────────────────────────────────────────────── */
export const OVERLAY_EVENT = "madelarme:overlay";
/** Оверлеи (меню, панель контактов, плеер, story) шлют один раз на открытие и один раз на закрытие */
export function emitOverlay(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OVERLAY_EVENT, { detail: { open } }));
}

/** true, пока открыт хотя бы один оверлей (считает вложенные) */
export function useOverlayOpen(): boolean {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const on = (e: Event) => {
      const open = Boolean((e as CustomEvent<{ open?: boolean }>).detail?.open);
      setCount((c) => Math.max(0, c + (open ? 1 : -1)));
    };
    window.addEventListener(OVERLAY_EVENT, on);
    return () => window.removeEventListener(OVERLAY_EVENT, on);
  }, []);
  return count > 0;
}

/* ── scroll direction ──────────────────────────────────────────────────── */
/** { dir, y } — направление меняется только после сдвига > threshold px (без дрожания) */
export function useScrollDirection(threshold = 8): { dir: "up" | "down"; y: number } {
  const [state, setState] = useState<{ dir: "up" | "down"; y: number }>({ dir: "up", y: 0 });
  const last = useRef(0);
  const raf = useRef(0);
  useEffect(() => {
    last.current = window.scrollY;
    const on = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const y = window.scrollY;
        const delta = y - last.current;
        if (Math.abs(delta) < threshold && y > 0) {
          setState((s) => (s.y === y ? s : { ...s, y }));
          return;
        }
        const dir = y <= 0 ? "up" : delta > 0 ? "down" : "up";
        last.current = y;
        setState((s) => (s.dir === dir && s.y === y ? s : { dir, y }));
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf.current); raf.current = 0; };
  }, [threshold]);
  return state;
}

/* ── glyphs ────────────────────────────────────────────────────────────── */
type IconProps = { className?: string };
const ICON = "size-5 shrink-0";

export function WhatsAppGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn(ICON, className)} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function TelegramGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn(ICON, className)} fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function InstagramGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn(ICON, className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="19" height="19" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── clock leaf ────────────────────────────────────────────────────────── */
/** «18:42» по Алматы; до гидратации — «--:--», чтобы ширина не прыгала */
export function AlmatyClock({ className }: { className?: string }) {
  const t = useAlmatyTime();
  return (
    <time className={cn("tabular-nums", className)} dateTime={t || undefined} suppressHydrationWarning>
      {t || "--:--"}
    </time>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Sticky-полоса CTA (только телефон, <1024px)
   ════════════════════════════════════════════════════════════════════════ */
const HIDDEN_ON = ["/contact", "/reels"];
export const isStickyHidden = (pathname: string) => HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));

/** Зазор под полосу в конце футера: есть только там, где сама полоса может появиться */
export function StickySpacer() {
  const pathname = usePathname();
  if (isStickyHidden(pathname)) return null;
  return <div aria-hidden="true" className="h-(--sticky-h) lg:hidden [@media(max-height:500px)]:hidden" />;
}
/** id финальной секции (FinalCTA) — там те же кнопки, полоса дублировала бы их */
const FINAL_CTA_ID = "cta";

/** true, пока секция #cta видна хотя бы на 30 % (перепроверяется при смене маршрута) */
function useFinalCtaInView(pathname: string): boolean {
  /* состояние привязано к маршруту: на новой странице сбрасывается без setState в эффекте */
  const [state, setState] = useState<{ path: string; inView: boolean }>({ path: pathname, inView: false });
  useEffect(() => {
    const el = document.getElementById(FINAL_CTA_ID);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setState({ path: pathname, inView: e.isIntersecting }), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  return state.path === pathname && state.inView;
}

export default function StickyCTA() {
  const pathname = usePathname();
  const text = useStickyPrefill();
  const overlay = useOverlayOpen();
  const { dir, y } = useScrollDirection();
  const reduce = useReducedMotion();
  const ctaInView = useFinalCtaInView(pathname);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  if (isStickyHidden(pathname)) return null;

  const visible = !overlay && !ctaInView && vh > 0 && y > vh * 0.6 && dir === "up";

  return (
    <motion.div
      role="region"
      aria-label="Быстрая связь"
      aria-hidden={!visible}
      initial={false}
      animate={{ y: visible ? 0 : "110%" }}
      transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden [@media(max-height:500px)]:hidden",
        "border-t border-rule bg-ink pb-[env(safe-area-inset-bottom)]",
        !visible && "pointer-events-none",
      )}
    >
      <div className="flex h-(--sticky-h) items-stretch">
        <a
          href={waLink(text)}
          target="_blank"
          rel="noopener"
          tabIndex={visible ? 0 : -1}
          className="mono flex w-[60%] items-center justify-center gap-2.5 bg-signal px-3 font-medium text-ink transition-colors hover:bg-milk"
        >
          <WhatsAppGlyph />
          Обсудить съёмку
        </a>
        <a
          href={tgLink(text)}
          target="_blank"
          rel="noopener"
          aria-label="Написать в Telegram"
          tabIndex={visible ? 0 : -1}
          className="flex flex-1 items-center justify-center border-l border-rule text-milk transition-colors hover:text-signal"
        >
          <TelegramGlyph className="size-6" />
        </a>
        <a
          href={igDmLink()}
          target="_blank"
          rel="noopener"
          aria-label="Написать в Instagram"
          tabIndex={visible ? 0 : -1}
          className="flex flex-1 items-center justify-center border-l border-rule text-milk transition-colors hover:text-signal"
        >
          <InstagramGlyph className="size-6" />
        </a>
      </div>
    </motion.div>
  );
}
