import Link from "next/link";
import type { Case, Format } from "@/content/types";
import { isLongTitle, pad2 } from "@/lib/utils";
import CinemaVideo from "@/components/media/CinemaVideo";
import PlayFilmButton from "@/components/work/PlayFilmButton";
import { realFilm } from "@/components/work/film";

/**
 * Экран-тизер кейса (100svh): беззвучный луп, моно-строка [ 01 / 24 ] · [ формат ] · [ город · год ],
 * название дисплеем, логлайн, кнопка «▶ Смотреть фильм». H1 и CTA — с сервера, без opacity:0.
 * Нет ни города, ни года — чипа [ город · год ] нет; есть одно из двух — в чипе только оно.
 * Низ: запас 84px + safe-area (телефон) / 80px (десктоп), чтобы CTA не накрывала кнопку паузы CinemaVideo (bottom-4 right-4, 44px).
 */
const chip = "inline-flex items-center bg-ink/50 px-1.5 text-milk backdrop-blur-[2px]";

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
  const longTitle = isLongTitle(c.title);
  const place = [c.city, c.year].filter(Boolean).join(" · ");
  /* демо-луп вместо фильма кнопку не получает: «08:12» на 8-секундном лупе выглядит как сломанный плеер */
  const film = realFilm(c.fullVideo);
  /* реальное видео с фактами на согласовании ≠ вымышленный клиент */
  const badge = c.factsUnconfirmed
    ? "Факты на согласовании"
    : c.isPlaceholder
      ? "Демо-контент · клиент вымышлен"
      : null;
  return (
    <section className="relative h-svh min-h-[560px] overflow-hidden bg-ink">
      <CinemaVideo loop={c.loop} priority mode="visible" pauseButton className="absolute inset-0" alt="" />
      <div className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-[70%]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-ink/85 via-ink/40 to-transparent" aria-hidden="true" />

      {/* верхняя моно-строка: на телефоне — «← работы», мета, плашка «демо» под метой; на десктопе — мета слева, ссылка и плашка справа */}
      <div className="absolute inset-x-0 top-(--header-h) z-10 flex flex-col gap-2 px-gutter pt-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:pt-3">
        <div className="order-2 flex min-w-0 flex-col gap-2 lg:order-1">
          <div className="mono flex flex-wrap gap-x-2 gap-y-1">
            <span className={chip}>[ {pad2(index)} / {pad2(total)} ]</span>
            {format && <span className={chip}>[ {format.name} ]</span>}
            {place && <span className={chip}>[ {place} ]</span>}
          </div>
          {badge && (
            <span className="mono-sm self-start border border-milk/40 bg-ink/50 px-2 py-1 text-milk/80 backdrop-blur-[2px] lg:hidden">
              {badge}
            </span>
          )}
        </div>
        <div className="order-1 flex items-center justify-between gap-3 lg:order-2 lg:flex-col lg:items-end lg:gap-2">
          <Link href="/work" className="mono inline-flex h-11 items-center self-start text-milk hover:text-signal"><span className="bg-ink/50 px-1.5 py-0.5 backdrop-blur-[2px]">
            ← работы</span>
          </Link>
          {badge && (
            <span className="mono-sm hidden border border-milk/40 bg-ink/50 px-2 py-1 text-right text-milk/80 backdrop-blur-[2px] lg:block">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* низ: название, логлайн, CTA */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-5 px-gutter pb-[calc(84px+env(safe-area-inset-bottom))] lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-20">
        <div className="min-w-0 lg:max-w-[60vw]">
          <h1
            className={
              longTitle
                ? "disp text-[clamp(36px,10vw,140px)] [text-wrap:balance]"
                : "disp text-[clamp(44px,15vw,200px)] whitespace-nowrap"
            }
          >
            {c.title}
          </h1>
          <p className="mt-4 max-w-[46ch] text-[18px] leading-snug text-milk/90 lg:text-[20px]">{c.logline}</p>
        </div>
        {film && (
          <div className="shrink-0">
            <PlayFilmButton video={film} title={c.title} size="lg" className="w-full lg:w-auto" />
          </div>
        )}
      </div>
    </section>
  );
}
