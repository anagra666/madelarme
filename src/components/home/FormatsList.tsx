import Image from "next/image";
import Link from "next/link";
import { countByFormat, formatPriceText, getFormat, settings } from "@/lib/content";
import { pad2 } from "@/lib/utils";
import { Section, Eyebrow, Container } from "@/components/ui/Section";
import FormatsPreview, { type PreviewItem } from "./FormatsPreview.client";

/*
 * Упор Маши — репортаж (ответы 2026-11): сначала форматы, в которых уже есть работы (у них и лупы из этих работ),
 * затем репортажные без работ — корпоратив, день рождения, бэкстейдж; прощание последним, отдельной тихой строкой.
 * Остальные услуги (той, бренд-фильм, клип, контент) — на /formats.
 */
const ORDER = ["wedding-film", "love-story", "aftermovie", "activation", "corporate", "birthday", "backstage", "funeral"];

/* форматы, где плывущий кадр за курсором неуместен: строка остаётся обычной ссылкой, без превью */
const QUIET = new Set(["funeral"]);

/** «8–12 мин» одним куском: неразрывные пробелы и word joiner вокруг тире (после «–» браузер переносит строку) */
const unbroken = (s: string) => s.replace(/ /g, "\u00a0").replace(/–/g, "\u2060–\u2060");

/** Опубликованные форматы в порядке главной — и для секции, и для нумерации секций в page.tsx */
export function homeFormats() {
  return ORDER.map((slug) => getFormat(slug)).filter((f) => f !== undefined);
}

/** 06 · Что снимаю — гигантские строки форматов на бумаге, кадр за курсором на десктопе */
export default function FormatsList({ num = "06" }: { num?: string }) {
  const formats = homeFormats();
  if (formats.length === 0) return null;

  const showPrices = settings.toggles.showPrices;
  /* без лупа — титр с термином формата («music video»), а не пустой кадр */
  const previews: PreviewItem[] = formats.filter((f) => !QUIET.has(f.slug)).map((f) => ({
    slug: f.slug,
    src: f.loop?.posterH,
    alt: f.name,
    label: f.term.split("/")[0].trim(),
  }));

  return (
    <Section paper aria-labelledby="formats-title" className="py-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
          <Eyebrow>[ {num} ] · ЧТО СНИМАЮ</Eyebrow>
          <span className="mono hidden text-meta lg:block">
            {formats.length} форматов{showPrices && settings.toggles.pricesAreDemo && " · цены — демо"}
          </span>
        </div>
        <h2 id="formats-title" className="sr-only">Что снимаю</h2>

        {/* relative — контейнер для плывущего кадра; строки помечены data-format */}
        <div className="relative">
        <ul className="border-b border-rule">
          {formats.map((f, i) => {
            const count = countByFormat(f.slug);
            /* «—» в duration — хронометраж не называем (прощание); «8–12 мин» на телефоне переносится целиком */
            const meta = [showPrices ? formatPriceText(f) : null, f.duration !== "—" ? unbroken(f.duration) : null]
              .filter(Boolean)
              .join(" · ");
            /* «(0)» читается как «таких работ нет» — счётчик только когда есть что показать */
            const counter = count > 0 ? `(${count})` : null;
            const metaMobile = [counter, meta].filter(Boolean).join(" · ");
            return (
              <li key={f.slug}>
                <Link
                  href={`/formats/${f.slug}`}
                  prefetch={false}
                  data-format={f.slug}
                  className="group relative flex min-h-[88px] items-center justify-between gap-4 border-t border-rule py-4 lg:py-5"
                >
                  <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-baseline lg:gap-5">
                    <span className="mono-sm hidden w-8 text-meta lg:block">{pad2(i + 1)}</span>
                    <span className="disp text-row leading-[.86] transition-colors duration-300 group-hover:text-signal">
                      {f.name}
                      {counter && <span className="mono ml-3 hidden align-top text-meta lg:inline">{counter}</span>}
                    </span>
                    {metaMobile && <span className="mono text-meta lg:hidden">{metaMobile}</span>}
                  </div>

                  {/* десктоп: цена · хронометраж */}
                  <span className="mono hidden shrink-0 text-meta lg:block">{meta}</span>

                  {/* телефон: квадратный стилл 64px; без лупа — номер строки дисплеем в рамке (как хлопушка), не пустая плашка */}
                  {f.loop?.posterH ? (
                    <span className="relative block h-16 w-16 shrink-0 overflow-hidden bg-ink-2 lg:hidden">
                      <Image src={f.loop.posterH} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="disp grid h-16 w-16 shrink-0 place-items-center border border-rule text-[32px] leading-none text-meta lg:hidden"
                    >
                      {pad2(i + 1)}
                    </span>
                  )}

                  {/* подчёркивание в сигнальном цвете, scaleX 0 → 1 по hover */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-signal transition-transform duration-500 ease-out-expo group-hover:scale-x-100"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        <FormatsPreview items={previews} />
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/formats" className="mono inline-flex min-h-11 items-center text-milk hover:text-signal">
            полный список форматов и что в них входит&nbsp;→
          </Link>
        </div>
      </Container>
    </Section>
  );
}
