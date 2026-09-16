import Link from "next/link";
import type { Case, Format } from "@/content/types";
import { pad2 } from "@/lib/utils";
import CinemaVideo from "@/components/media/CinemaVideo";
import PlayFilmButton from "@/components/work/PlayFilmButton";

/**
 * Экран-тизер кейса (100svh): беззвучный луп, моно-строка [ 01 / 24 ] · [ формат ] · [ город · год ],
 * название дисплеем, логлайн, кнопка «▶ Смотреть фильм». H1 и CTA — с сервера, без opacity:0.
 */
export default function CaseTeaser({
  c,
  index,
  total,
  format,
}: {
  c: Case;
  index: number;
  total: number;
  format?: Format;
}) {
  const longTitle = c.title.length > 14;
  return (
    <section className="relative h-svh min-h-[560px] overflow-hidden bg-ink">
      <CinemaVideo loop={c.loop} priority mode="visible" pauseButton className="absolute inset-0" alt="" />
      <div className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-[70%]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-ink/70 to-transparent" aria-hidden="true" />

      {/* верхняя моно-строка: на телефоне — «← работы» и плашка строкой выше, мета ниже */}
      <div className="absolute inset-x-0 top-(--header-h) z-10 flex flex-col gap-1 px-gutter pt-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:pt-3">
        <div className="order-2 lg:order-1">
          <div className="mono flex flex-wrap gap-x-3 gap-y-1 text-milk/80">
            <span>[ {pad2(index)} / {pad2(total)} ]</span>
            {format && <span>· [ {format.name} ]</span>}
            <span>· [ {c.city} · {c.year} ]</span>
          </div>
        </div>
        <div className="order-1 flex items-center justify-between gap-3 lg:order-2 lg:flex-col lg:items-end lg:gap-2">
          <Link href="/work" className="mono inline-flex h-11 items-center text-milk hover:text-signal">
            ← работы
          </Link>
          {c.isPlaceholder && (
            <span className="mono-sm border border-milk/40 px-2 py-1 text-right text-milk/80">Демо-контент · клиент вымышлен</span>
          )}
        </div>
      </div>

      {/* низ: название, логлайн, CTA */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-5 px-gutter pb-[calc(24px+env(safe-area-inset-bottom))] lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-12">
        <div className="max-w-[18ch] lg:max-w-[60vw]">
          <h1 className={longTitle ? "disp text-h2 [text-wrap:balance]" : "disp text-h1 whitespace-nowrap"}>{c.title}</h1>
          <p className="mt-4 max-w-[46ch] text-[18px] leading-snug text-milk/90 lg:text-[20px]">{c.logline}</p>
        </div>
        {c.fullVideo && (
          <div className="shrink-0">
            <PlayFilmButton video={c.fullVideo} title={c.title} size="lg" className="w-full lg:w-auto" />
          </div>
        )}
      </div>
    </section>
  );
}
