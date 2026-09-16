"use client";

import type { FullVideo } from "@/content/types";
import Button from "@/components/ui/Button";
import { usePlayer } from "@/components/media/Player";

/** «▶ Смотреть фильм 08:12» — открывает плеер-оверлей. Маленький клиентский лист. */
export default function PlayFilmButton({
  video,
  title,
  size = "lg",
  className,
}: {
  video: FullVideo;
  title: string;
  size?: "md" | "lg" | "xl";
  className?: string;
}) {
  const { open } = usePlayer();
  return (
    <Button variant="signal" size={size} className={className} onClick={() => open(video, title)} aria-haspopup="dialog">
      <span aria-hidden="true">▶</span> Смотреть фильм <span className="opacity-70">{video.duration}</span>
    </Button>
  );
}
