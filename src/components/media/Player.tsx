"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { FullVideo } from "@/content/types";
import { useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Плеер-оверлей «сеанс»: две чернильные шторки-летербокс закрываются сверху/снизу,
 * под ними монтируется фильм, шторки открываются. Страница под плеером не меняется.
 *
 * Хост: <Player /> монтируется один раз (layout или страница кейса).
 * Открыть откуда угодно: const { open } = usePlayer(); open(case.fullVideo, case.title).
 * Единственное место на сайте, где разрешён iframe (YouTube nocookie / Vimeo / Bunny / Kinescope).
 */

/* ── модульный store ───────────────────────────────────────────────────── */
interface PlayerState {
  isOpen: boolean;
  video: FullVideo | null;
  title: string;
}

let state: PlayerState = { isOpen: false, video: null, title: "" };
/** элемент, с которого открыли плеер — вернуть фокус при закрытии */
let restoreEl: HTMLElement | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => state;

export function openPlayer(video: FullVideo, title: string) {
  if (typeof document !== "undefined") restoreEl = document.activeElement as HTMLElement | null;
  state = { isOpen: true, video, title };
  emit();
}

export function closePlayer() {
  if (!state.isOpen) return;
  state = { ...state, isOpen: false };
  emit();
}

export function usePlayer() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { isOpen: s.isOpen, video: s.video, title: s.title, open: openPlayer, close: closePlayer };
}

/* ── helpers ───────────────────────────────────────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const;

function embedSrc(v: FullVideo): string | null {
  switch (v.provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1`;
    case "vimeo":
      return `https://player.vimeo.com/video/${v.id}?autoplay=1`;
    case "bunny":
      return `https://iframe.mediadelivery.net/embed/${v.id}?autoplay=true`;
    case "kinescope":
      return `https://kinescope.io/embed/${v.id}?autoplay=1`;
    default:
      return null;
  }
}

function tc(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const FOCUSABLE = 'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])';

type Phase = "idle" | "closing" | "film" | "leaving";

/* ── host ──────────────────────────────────────────────────────────────── */
export default function Player() {
  const { isOpen, video, title } = usePlayer();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* фазы сеанса: переход открыто/закрыто → шторки (state adjusted during render, без эффекта) */
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) setPhase(phase === "leaving" ? "film" : "closing");
    else if (phase !== "idle") setPhase("leaving");
  }

  /* событие для sticky-CTA / шапки (не на первом рендере) */
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    window.dispatchEvent(new CustomEvent("madelarme:overlay", { detail: { open: isOpen, kind: "player" } }));
  }, [isOpen]);

  const active = phase !== "idle";
  useScrollLock(active);

  /* страховка: если анимация шторок не завершилась (скрытая вкладка, reduced motion) — двигаем фазу по таймеру */
  useEffect(() => {
    if (phase !== "closing" && phase !== "leaving") return;
    const id = window.setTimeout(
      () => setPhase((p) => (p === "closing" ? "film" : p === "leaving" ? "idle" : p)),
      (reduce ? 0 : 400) + 120,
    );
    return () => window.clearTimeout(id);
  }, [phase, reduce]);

  /* Esc + focus trap */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePlayer();
        return;
      }
      if (e.key === "Tab" && rootRef.current) {
        const els = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  /* фокус: на крестик при открытии, назад — при закрытии */
  useEffect(() => {
    if (phase === "film") closeRef.current?.focus();
    if (phase === "idle" && restoreEl) {
      restoreEl.focus?.();
      restoreEl = null;
    }
  }, [phase]);

  const barsClosed = phase === "closing" || phase === "leaving";
  const dur = reduce ? 0 : 0.4;

  if (!active) return null;

  /* портал в body: над шапкой и вне любых stacking-context страницы */
  return createPortal(
        <div
          ref={rootRef}
          role="dialog"
          aria-modal="true"
          aria-label={title ? `Фильм «${title}»` : "Плеер"}
          className={cn("fixed inset-0 z-50", phase === "closing" ? "pointer-events-none" : "bg-ink")}
          data-lenis-prevent
        >
          {/* фильм — только когда шторки закрылись */}
          {(phase === "film" || phase === "leaving") && video && (
            <Film video={video} title={title} closeRef={closeRef} />
          )}

          {/* шторки-летербокс */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-ink"
            initial={{ height: "0%" }}
            animate={{ height: barsClosed ? "50%" : "0%" }}
            transition={{ duration: dur, ease: EASE }}
            onAnimationComplete={() => {
              if (phase === "closing") setPhase("film");
              else if (phase === "leaving") setPhase("idle");
            }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-ink"
            initial={{ height: "0%" }}
            animate={{ height: barsClosed ? "50%" : "0%" }}
            transition={{ duration: dur, ease: EASE }}
          />
        </div>,
    document.body,
  );
}

/* ── фильм внутри сеанса ───────────────────────────────────────────────── */
function Film({
  video,
  title,
  closeRef,
}: {
  video: FullVideo;
  title: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const src = embedSrc(video);
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* верхняя строка: название + закрыть */}
      <div className="relative z-30 flex h-14 shrink-0 items-center justify-between pl-gutter pr-2">
        <div className="mono truncate text-milk">
          <span className="text-signal">●</span> {title || "Фильм"}
          <span className="text-meta"> · {video.duration}</span>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={closePlayer}
          aria-label="Закрыть плеер"
          className="grid h-11 w-11 place-items-center text-milk transition-colors hover:text-signal"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {video.provider === "self" ? (
          <SelfVideo video={video} />
        ) : (
          src && (
            <iframe
              src={src}
              title={title || "Фильм"}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )
        )}
      </div>
    </div>
  );
}

/* ── self-hosted: минимальный свой chrome ──────────────────────────────── */
function SelfVideo({ video }: { video: FullVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [total, setTotal] = useState(0);
  const [muted, setMuted] = useState(video.hasSound === false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setCur(v.currentTime);
    const onMeta = () => setTotal(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    v.play().catch(() => setPlaying(false));
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onPause);
      v.pause();
    };
  }, []);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekTo = useCallback((sec: number) => {
    const v = ref.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(Math.max(sec, 0), v.duration);
  }, []);

  const fullscreen = useCallback(() => {
    const box = boxRef.current;
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (box?.requestFullscreen) box.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.(); // iPhone Safari
  }, []);

  const pct = total ? (cur / total) * 100 : 0;

  return (
    <div ref={boxRef} className="absolute inset-0 bg-ink">
      <video
        ref={ref}
        src={video.id}
        controls={false}
        playsInline
        preload="metadata"
        muted={muted}
        className="absolute inset-0 h-full w-full object-contain"
      />

      {/* клик по кадру — play/pause */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Пауза" : "Воспроизвести"}
        className="absolute inset-0 z-10 cursor-pointer"
      >
        {!playing && (
          <span className="mono absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center border border-milk/60 bg-ink/40 text-milk">
            <Play size={20} strokeWidth={1.5} />
          </span>
        )}
      </button>

      {/* нижняя строка: таймкод · таймлайн · звук · fullscreen */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-14 items-center gap-3 pl-gutter pr-2 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Пауза" : "Воспроизвести"}
          className="grid h-11 w-11 shrink-0 place-items-center text-milk hover:text-signal"
        >
          {playing ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} />}
        </button>

        <span className="mono shrink-0 text-milk" aria-live="off">
          {tc(cur)} <span className="text-meta">/ {tc(total || 0)}</span>
        </span>

        {/* свой таймлайн */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Таймлайн"
          aria-valuemin={0}
          aria-valuemax={Math.floor(total || 0)}
          aria-valuenow={Math.floor(cur)}
          aria-valuetext={tc(cur)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - r.left) / r.width) * total);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); seekTo(cur + 5); }
            if (e.key === "ArrowLeft") { e.preventDefault(); seekTo(cur - 5); }
            if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
          }}
          className="group relative h-11 flex-1 cursor-pointer"
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-milk/25" />
          <span className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-signal" style={{ width: `${pct}%` }} />
          <span
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-signal"
            style={{ left: `${pct}%` }}
          />
        </div>

        {video.hasSound !== false && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Включить звук" : "Выключить звук"}
            aria-pressed={muted}
            className="grid h-11 w-11 shrink-0 place-items-center text-milk hover:text-signal"
          >
            {muted ? <VolumeX size={18} strokeWidth={1.5} /> : <Volume2 size={18} strokeWidth={1.5} />}
          </button>
        )}

        <button
          type="button"
          onClick={fullscreen}
          aria-label="На весь экран"
          className="grid h-11 w-11 shrink-0 place-items-center text-milk hover:text-signal"
        >
          <Maximize2 size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
