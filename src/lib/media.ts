/**
 * Малая копия постера для мини-превью (next/image работает unoptimized, srcset не строится):
 * /media/posters/x-h.webp → /media/posters/x-h-s.webp, x-v.webp → x-v-s.webp.
 * Файлы делает scripts/media.mjs (pnpm media): -v 180×320, -h 400×225.
 */
export function small(src: string): string {
  return src.replace(/-([vh])\.webp$/, "-$1-s.webp");
}

/** Копия кадра шириной 800: /media/stills/x.webp → /media/stills/x-800.webp */
export function still800(src: string): string {
  return src.replace(/\.webp$/, "-800.webp");
}

/**
 * Намерение наведения: настоящее движение мыши, а не «строка уехала под неподвижный курсор».
 * При скролле под курсором браузер шлёт mouseenter/over без pointermove (а синтетический, если и придёт, —
 * с теми же clientX/Y), поэтому лупы по hover запускаем только когда координаты изменились.
 */
let lastPoint: { x: number; y: number } | null = null;
/* позицию запоминаем и вне строк/карточек: иначе после движения мыши в другом месте и прокрутки колесом
   первое синтетическое событие над строкой выглядело бы настоящим движением. Слушатель на window срабатывает
   после обработчиков React (всплытие), поэтому внутри pointerMoved lastPoint — ещё предыдущая точка */
if (typeof window !== "undefined") {
  window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") lastPoint = { x: e.clientX, y: e.clientY }; }, { passive: true });
}
export function pointerMoved(e: { clientX: number; clientY: number; pointerType?: string }): boolean {
  if (e.pointerType && e.pointerType !== "mouse") return false;
  const moved = !lastPoint || lastPoint.x !== e.clientX || lastPoint.y !== e.clientY;
  lastPoint = { x: e.clientX, y: e.clientY };
  return moved;
}

/** Пауза «курсор задержался» перед загрузкой лупа по hover, мс */
export const HOVER_INTENT_MS = 120;
