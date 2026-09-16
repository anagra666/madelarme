"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MediaLoop } from "@/content/types";
import { cn, isTouch, prefersReducedMotion, saveData } from "@/lib/utils";

/**
 * Единственный способ показывать беззвучные лупы на сайте.
 *
 * — постер рендерится сервером через <picture> (портрет/ландшафт) — это LCP, без opacity:0;
 * — src подставляется на клиенте (портретный файл на телефоне), preload=none до появления во viewport;
 * — играет только когда виден (IntersectionObserver), пауза в фоне (visibilitychange);
 * — лимит одновременно играющих: 1 на тач-устройствах, 3 на десктопе;
 * — autoplay заблокирован (Low Power Mode, Instagram in-app) → постер + кнопка ▶ (жест пользователя);
 * — saveData / 2g → видео не грузится вообще; prefers-reduced-motion → без автоплея.
 */

type Mode = "visible" | "hover" | "manual";

export interface CinemaVideoProps {
  loop: MediaLoop;
  className?: string;
  /** hero: postер с высоким приоритетом и preload=metadata */
  priority?: boolean;
  /** visible — по видимости; hover — по наведению (десктоп-списки); manual — по пропу playing */
  mode?: Mode;
  playing?: boolean;
  /** принудительно горизонтальный/вертикальный файл (по умолчанию — по ориентации экрана) */
  orientation?: "auto" | "h" | "v";
  /** показывать кнопку паузы (WCAG 2.2.2) — для hero */
  pauseButton?: boolean;
  /** object-position постера и видео, напр. "50% 30%" */
  focus?: string;
  /** sizes для <img> постера */
  sizes?: string;
  alt?: string;
  onPlayingChange?: (playing: boolean) => void;
}

/* ── глобальный лимитер играющих видео ─────────────────────────────────── */
const playingSet = new Set<HTMLVideoElement>();
function limitPlaying(current: HTMLVideoElement) {
  const max = isTouch() ? 1 : 3;
  playingSet.add(current);
  if (playingSet.size <= max) return;
  for (const v of playingSet) {
    if (v !== current) {
      v.pause();
      playingSet.delete(v);
      if (playingSet.size <= max) break;
    }
  }
}

export default function CinemaVideo({
  loop,
  className,
  priority = false,
  mode = "visible",
  playing = false,
  orientation = "auto",
  pauseButton = false,
  focus = "50% 50%",
  sizes = "100vw",
  alt = "",
  onPlayingChange,
}: CinemaVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const wantPlay = useRef(false);
  const id = useId();

  const hasV = Boolean(loop.mp4V);
  const usePortrait = () =>
    orientation === "v" || (orientation === "auto" && hasV && window.matchMedia("(orientation: portrait)").matches);

  /* выбрать файл — один раз, когда видео реально нужно */
  const ensureSrc = useCallback(() => {
    if (src) return;
    if (saveData()) { setNoVideo(true); return; }
    setSrc(usePortrait() ? (loop.mp4V as string) : loop.mp4H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, loop.mp4H, loop.mp4V, orientation]);

  const tryPlay = useCallback(() => {
    const v = ref.current;
    if (!v || userPaused) return;
    if (prefersReducedMotion()) { setBlocked(true); return; }
    ensureSrc();
    wantPlay.current = true;
    const attempt = () => {
      const p = v.play();
      if (!p) return;
      p.then(() => { setBlocked(false); limitPlaying(v); }).catch(() => {
        // Instagram in-app / первый запуск: одна повторная попытка
        setTimeout(() => {
          if (!wantPlay.current) return;
          v.play().then(() => { setBlocked(false); limitPlaying(v); }).catch(() => setBlocked(true));
        }, 250);
      });
    };
    if (v.readyState >= 2 || v.src) attempt();
    else v.addEventListener("loadedmetadata", attempt, { once: true });
  }, [ensureSrc, userPaused]);

  const doPause = useCallback(() => {
    const v = ref.current;
    wantPlay.current = false;
    if (v) { v.pause(); playingSet.delete(v); }
  }, []);

  /* src подставляем в DOM только после выбора (иначе preload=none не спасёт) */
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    if (v.getAttribute("src") !== src) {
      v.setAttribute("src", src);
      v.load();
      if (wantPlay.current) tryPlay();
    }
  }, [src, tryPlay]);

  /* режим visible: IntersectionObserver */
  useEffect(() => {
    if (mode !== "visible") return;
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.4) tryPlay();
          else doPause();
        }
      },
      { threshold: [0, 0.4, 0.8] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode, tryPlay, doPause]);

  /* режим manual */
  useEffect(() => {
    if (mode !== "manual") return;
    if (playing) tryPlay();
    else doPause();
  }, [mode, playing, tryPlay, doPause]);

  /* пауза в фоне */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) ref.current?.pause();
      else if (wantPlay.current) ref.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* события плеера → состояние */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const on = () => { setIsPlaying(true); onPlayingChange?.(true); };
    const off = () => { setIsPlaying(false); onPlayingChange?.(false); playingSet.delete(v); };
    v.addEventListener("playing", on);
    v.addEventListener("pause", off);
    v.addEventListener("ended", off);
    return () => { v.removeEventListener("playing", on); v.removeEventListener("pause", off); v.removeEventListener("ended", off); };
  }, [onPlayingChange]);

  const hoverProps =
    mode === "hover"
      ? {
          onMouseEnter: () => tryPlay(),
          onMouseLeave: () => doPause(),
          onFocus: () => tryPlay(),
          onBlur: () => doPause(),
        }
      : {};

  const showPlayButton = (blocked || noVideo) && !isPlaying && mode !== "hover";

  return (
    <div
      ref={boxRef}
      className={cn("relative overflow-hidden bg-ink", className)}
      data-playing={isPlaying || undefined}
      {...hoverProps}
    >
      {/* постер — SSR, корректная ориентация через <picture>, LCP без JS */}
      <picture>
        {loop.posterV && orientation !== "h" && (
          <source media={orientation === "v" ? "all" : "(orientation: portrait)"} srcSet={loop.posterV} />
        )}
        <img
          src={orientation === "v" && loop.posterV ? loop.posterV : loop.posterH}
          alt={alt}
          sizes={sizes}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: focus }}
        />
      </picture>

      {!noVideo && (
        <video
          ref={ref}
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          preload={priority ? "metadata" : "none"}
          aria-hidden="true"
          tabIndex={-1}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            isPlaying ? "opacity-100" : "opacity-0",
          )}
          style={{ objectPosition: focus }}
        />
      )}

      {showPlayButton && (
        <button
          type="button"
          aria-label="Воспроизвести"
          onClick={() => { setUserPaused(false); setBlocked(false); ensureSrc(); tryPlay(); }}
          className="absolute inset-0 z-10 grid place-items-center"
        >
          <span className="mono grid h-14 w-14 place-items-center border border-milk/60 bg-ink/40 text-milk backdrop-blur-[2px]">
            ▶
          </span>
        </button>
      )}

      {pauseButton && !noVideo && (
        <button
          type="button"
          aria-pressed={userPaused}
          aria-label={userPaused ? "Воспроизвести видео" : "Остановить видео"}
          aria-describedby={id}
          onClick={() => {
            if (userPaused) { setUserPaused(false); wantPlay.current = true; ref.current?.play().catch(() => setBlocked(true)); }
            else { setUserPaused(true); doPause(); }
          }}
          className="mono-sm absolute bottom-4 right-4 z-10 grid h-11 w-11 place-items-center border border-milk/40 bg-ink/40 text-milk backdrop-blur-[2px] hover:border-milk"
        >
          {userPaused ? "▶" : "❚❚"}
          <span id={id} className="sr-only">Фоновое видео без звука</span>
        </button>
      )}
    </div>
  );
}
