"use client";

import CinemaVideo from "@/components/media/CinemaVideo";
import { usePlayer } from "@/components/media/Player";
import Button from "@/components/ui/Button";
import type { FullVideo, MediaLoop } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Большой луп шоурила 16:9 (без звука). Кнопка «смотреть целиком» — только когда есть настоящий
 * фильм-шоурил (film); без него под лупом остаётся подпись про звук. Хост <Player /> смонтирован в layout.tsx.
 */
export default function ShowreelBlock({ loop, film, title }: { loop: MediaLoop; film?: FullVideo; title: string }) {
  const { open } = usePlayer();
  return (
    <div>
      <CinemaVideo loop={loop} mode="visible" pauseButton priority orientation="h" className="relative aspect-video w-full" alt={title} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4">
        {film ? (
          <>
            <p className="mono text-meta">
              {film.duration} · {film.hasSound ? "звук: есть" : "звук: выкл"}
            </p>
            <Button variant="signal" size="lg" onClick={() => open(film, title)} aria-haspopup="dialog">
              {film.hasSound ? "▶ смотреть со звуком" : "▶ смотреть целиком"}
            </Button>
          </>
        ) : (
          <p className="mono text-meta">звук: выкл</p>
        )}
      </div>
    </div>
  );
}

/**
 * «▶ смотреть 01:05» в строке списка работ — открывает фильм кейса в Player.
 * На телефоне видны только ▶ и хронометраж; «смотреть фильм «…»» остаётся в доступном имени.
 */
export function WatchFilmButton({ video, title, className }: { video: FullVideo; title: string; className?: string }) {
  const { open } = usePlayer();
  return (
    <button
      type="button"
      onClick={() => open(video, title)}
      aria-haspopup="dialog"
      className={cn("mono inline-flex h-11 shrink-0 items-center gap-2 text-milk transition-colors hover:text-signal", className)}
    >
      <span aria-hidden="true" className="text-signal">▶</span>
      {/* пробелы внутри span: из соседних sr-only-кусков иначе склеится «смотретьфильм» */}
      <span className="tabular-nums">
        <span className="sr-only sm:not-sr-only">смотреть </span>
        <span className="sr-only">фильм «{title}» </span>
        {video.duration}
      </span>
    </button>
  );
}
