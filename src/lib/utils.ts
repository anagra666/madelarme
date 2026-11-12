import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Длительность → секунды: «65» (голые секунды), «08:12» (ММ:СС), «1:02:03» (Ч:ММ:СС). Пусто или мусор → 0 */
export function parseDuration(s: string): number {
  const p = s.trim().split(":").map(Number);
  if (p.length > 3 || p.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  return Math.round(p.reduce((acc, n) => acc * 60 + n, 0));
}

/** Названия кейсов длиннее 14 символов («Red Bull Annual Recap») дисплеем в одну строку не влезают */
export function isLongTitle(title: string): boolean {
  return title.length > 14;
}

/** Перенос названия кейса: короткое — в одну строку, длинное — не больше двух строк с balance (ширину колонки считает вызывающий) */
export function titleWrap(title: string): string {
  return isLongTitle(title) ? "[text-wrap:balance]" : "whitespace-nowrap";
}

/** «8–12 мин» одним куском: неразрывные пробелы и word joiner вокруг тире (после «–» браузер переносит строку) */
export const unbroken = (s: string) => s.replace(/ /g, "\u00a0").replace(/–/g, "\u2060–\u2060");

/** 01, 02 … */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function isTouch(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Экономия трафика (явная настройка пользователя): не грузим видео вообще.
 *  effectiveType не используем — оценка Chrome часто врёт (эмуляции, in-app браузеры). */
export function saveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(c?.saveData);
}
