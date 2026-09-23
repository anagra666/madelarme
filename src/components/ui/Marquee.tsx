import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Бегущая строка на CSS (transform на compositor). Контент дублируется честно для бесшовности.
 * Пауза по hover; при фокусе с клавиатуры (:focus-visible) анимация снимается (трек встаёт на место,
 * и браузер докручивает контейнер до ссылки в фокусе). Именно focus-visible, а не focus-within:
 * клик мышью тоже даёт фокус на mousedown, и прыжок трека до mouseup «съел» бы клик.
 * При prefers-reduced-motion — статичный ряд.
 */
export default function Marquee({
  children,
  className,
  duration = 40,
  reverse = false,
  gap = "3rem",
}: {
  children: ReactNode;
  className?: string;
  /** секунд на полный оборот */
  duration?: number;
  reverse?: boolean;
  gap?: string;
}) {
  return (
    <div
      className={cn("group flex overflow-hidden [--gap:3rem] motion-reduce:overflow-x-auto", className)}
      style={{ ["--gap" as string]: gap, ["--dur" as string]: `${duration}s` }}
      aria-live="off"
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1 || undefined}
          inert={i === 1 || undefined}
          className={cn(
            "flex shrink-0 items-center gap-(--gap) pr-(--gap) will-change-transform",
            "animate-[marquee_var(--dur)_linear_infinite] group-hover:[animation-play-state:paused] group-has-[:focus-visible]:animate-none motion-reduce:animate-none",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
      <style>{`@keyframes marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-100%,0,0)}}`}</style>
    </div>
  );
}
