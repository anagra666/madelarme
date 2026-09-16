import Image from "next/image";
import Link from "next/link";
import { countByFormat, formatPrice, getFormat, settings } from "@/lib/content";
import { Section, Eyebrow, Container } from "@/components/ui/Section";
import FormatsPreview, { type PreviewItem } from "./FormatsPreview.client";

const ORDER = ["wedding-film", "love-story", "toi", "aftermovie", "brand-film", "music-video", "content-day", "interview"];

/** 06 · Что снимаю — гигантские строки форматов на бумаге, кадр за курсором на десктопе */
export default function FormatsList() {
  const formats = ORDER.map((slug) => getFormat(slug)).filter((f) => f !== undefined);
  if (formats.length === 0) return null;

  const showPrices = settings.toggles.showPrices;
  const previews: PreviewItem[] = formats
    .filter((f) => f.loop?.posterH)
    .map((f) => ({ slug: f.slug, src: f.loop!.posterH, alt: f.name }));

  return (
    <Section paper aria-labelledby="formats-title" className="py-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
          <Eyebrow>[ 06 ] · ЧТО СНИМАЮ</Eyebrow>
          <span className="mono hidden text-meta lg:block">{formats.length} форматов</span>
        </div>
        <h2 id="formats-title" className="sr-only">Что снимаю</h2>

        {/* relative — контейнер для плывущего кадра; строки помечены data-format */}
        <div className="relative">
        <ul className="border-b border-rule">
          {formats.map((f, i) => {
            const count = countByFormat(f.slug);
            const meta = [showPrices && f.fromPrice ? formatPrice(f.fromPrice) : null, f.duration]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={f.slug}>
                <Link
                  href={`/formats/${f.slug}`}
                  data-format={f.slug}
                  className="group relative flex min-h-[88px] items-center justify-between gap-4 border-t border-rule py-4 lg:py-5"
                >
                  <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-baseline lg:gap-5">
                    <span className="mono-sm hidden w-8 text-meta lg:block">{String(i + 1).padStart(2, "0")}</span>
                    <span className="disp text-row leading-[.86] transition-colors duration-300 group-hover:text-signal">
                      {f.name}
                      <span className="mono ml-3 hidden align-top text-meta lg:inline">({count})</span>
                    </span>
                    <span className="mono text-meta lg:hidden">
                      ({count}){meta ? ` · ${meta}` : ""}
                    </span>
                  </div>

                  {/* десктоп: цена · хронометраж */}
                  <span className="mono hidden shrink-0 text-meta lg:block">{meta}</span>

                  {/* телефон: квадратный стилл 64px */}
                  <span className="relative block h-16 w-16 shrink-0 overflow-hidden bg-ink-2 lg:hidden">
                    {f.loop?.posterH ? (
                      <Image src={f.loop.posterH} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="mono-sm absolute inset-0 grid place-items-center text-meta">—</span>
                    )}
                  </span>

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
            полный список форматов и что в них входит →
          </Link>
        </div>
      </Container>
    </Section>
  );
}
