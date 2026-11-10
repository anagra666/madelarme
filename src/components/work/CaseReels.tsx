import type { MediaLoop } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { Eyebrow } from "@/components/ui/Section";

/**
 * Вертикальные фрагменты из фильма — лента 9:16: rail на телефоне, на десктопе плитки в ширину колонки из 4.
 * Это кадрирование из фильма, а не сданные клиенту Reels, поэтому подписи нейтральные: «Фрагмент 01».
 * Меньше четырёх роликов — плитки по центру, а не «одна плитка слева и три пустые колонки». ≤8 видео.
 */
export default function CaseReels({ reels, title }: { reels: MediaLoop[]; title: string }) {
  const list = reels.slice(0, 8);
  return (
    <section className="border-t border-rule py-10 lg:py-16" aria-label={`Вертикальные фрагменты — ${title}`}>
      <div className="mb-5 flex items-baseline justify-between px-gutter">
        <Eyebrow>[ вертикальные фрагменты ]</Eyebrow>
        <span className="mono text-meta">{list.length} × 9:16</span>
      </div>
      <ul className="rail lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:px-gutter lg:[scroll-snap-type:none]">
        {list.map((r, i) => (
          <li key={r.mp4V ?? r.mp4H ?? i} className="w-[62vw] max-w-[320px] lg:w-[calc((100%-3rem)/4)] lg:max-w-none">
            <CinemaVideo
              loop={r}
              orientation="v"
              mode="visible"
              className="aspect-[9/16] w-full"
              sizes="(min-width: 1024px) 25vw, 62vw"
            />
            <div className="mono-sm mt-2 text-meta">Фрагмент {String(i + 1).padStart(2, "0")}</div>
          </li>
        ))}
        <li className="w-3 lg:hidden" aria-hidden="true" />
      </ul>
    </section>
  );
}
