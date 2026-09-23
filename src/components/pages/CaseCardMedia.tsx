"use client";

import CinemaVideo from "@/components/media/CinemaVideo";
import type { MediaLoop } from "@/content/types";
import { useFinePointer } from "@/lib/hooks";

/** Луп карточки: hover на мыши, по видимости — на тач (tap-эквивалент hover-приёма).
 *  Карточка целиком — ссылка, поэтому без кнопки ▶ (кнопка внутри <a> — невалидный HTML и уводит на кейс). */
export default function CaseCardMedia({ loop, className, alt }: { loop: MediaLoop; className?: string; alt?: string }) {
  const fine = useFinePointer();
  return <CinemaVideo loop={loop} mode={fine ? "hover" : "visible"} orientation="h" playButton={false} className={className} alt={alt} sizes="(min-width: 1024px) 33vw, 78vw" />;
}
