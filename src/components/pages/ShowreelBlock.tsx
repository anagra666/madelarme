"use client";

import CinemaVideo from "@/components/media/CinemaVideo";
import Player, { usePlayer } from "@/components/media/Player";
import Button from "@/components/ui/Button";
import type { FullVideo, MediaLoop } from "@/content/types";

/**
 * Большой луп шоурила 16:9 + кнопка «смотреть со звуком», открывающая Player-оверлей.
 * Хост <Player /> монтируется здесь; если интегратор смонтирует его в layout — убрать отсюда.
 */
export default function ShowreelBlock({ video, loop, title }: { video: FullVideo; loop: MediaLoop; title: string }) {
  const { open } = usePlayer();
  return (
    <div>
      <CinemaVideo loop={loop} mode="visible" pauseButton priority orientation="h" className="relative aspect-video w-full" alt={title} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4">
        <p className="mono text-meta">
          {video.duration} · {video.hasSound ? "звук: есть" : "звук: выкл"}
        </p>
        <Button variant="signal" size="lg" onClick={() => open(video, title)}>
          ▶ смотреть со звуком
        </Button>
      </div>
      <Player />
    </div>
  );
}
