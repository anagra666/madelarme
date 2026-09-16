import type { MediaLoop } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { Eyebrow } from "@/components/ui/Section";

/** Reels из кейса — лента 9:16: rail на телефоне, ряд из 4 на десктопе. ≤8 видео. */
export default function CaseReels({ reels, title }: { reels: MediaLoop[]; title: string }) {
  const list = reels.slice(0, 8);
  return (
    <section className="border-t border-rule py-10 lg:py-16" aria-label={`Reels — ${title}`}>
      <div className="mb-5 flex items-baseline justify-between px-gutter">
        <Eyebrow>[ Reels из кейса ]</Eyebrow>
        <span className="mono text-meta">{list.length} × 9:16</span>
      </div>
      <ul className="rail lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-gutter lg:[scroll-snap-type:none]">
        {list.map((r, i) => (
          <li key={r.mp4V ?? r.mp4H ?? i} className="w-[62vw] max-w-[320px] lg:w-auto lg:max-w-none">
            <CinemaVideo
              loop={r}
              orientation="v"
              mode="visible"
              className="aspect-[9/16] w-full"
              sizes="(min-width: 1024px) 25vw, 62vw"
            />
            <div className="mono-sm mt-2 text-meta">Reel {String(i + 1).padStart(2, "0")}</div>
          </li>
        ))}
        <li className="w-3 lg:hidden" aria-hidden="true" />
      </ul>
    </section>
  );
}
