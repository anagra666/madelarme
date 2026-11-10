import { getCases, getFormat } from "@/lib/content";
import { cn, isLongTitle, pad2 } from "@/lib/utils";
import CinemaVideo from "@/components/media/CinemaVideo";
import { Reveal, Line } from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { Section, Eyebrow } from "@/components/ui/Section";
import type { Case } from "@/content/types";

/** Обрезка по последнему пробелу до ~max символов */
function truncate(s: string, max = 180): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const i = cut.lastIndexOf(" ");
  return `${(i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[,.;:—–-]+$/, "")}…`;
}

function Block({ label, children }: { label: string; children: string }) {
  return (
    <div className="border-t border-rule pt-3">
      <div className="mono-sm text-meta">[ {label} ]</div>
      <p className="mt-2 max-w-[44ch] text-[15px] leading-snug lg:text-[16px]">{children}</p>
    </div>
  );
}

function Card({ c, i, total, num }: { c: Case; i: number; total: number; num: string }) {
  const paper = i % 2 === 1;
  const format = getFormat(c.format)?.name ?? c.format;
  const got = c.deliverables.map((d) => [d.name, d.duration].filter(Boolean).join(" ")).join(" · ");
  /* пустые город/год не оставляют «Red Bull Kazakhstan ·  · 2025» */
  const meta = [c.client, c.city, c.year].filter(Boolean).join(" · ");
  const long = isLongTitle(c.title);

  return (
    <Section
      paper={paper}
      aria-labelledby={`stacked-${c.slug}`}
      style={{ zIndex: i + 1 }}
      className={[
        /* липнем к top-0 (шапка при скролле вниз спрятана) и только на экранах, где карточка
           целиком влезает по высоте: на ноутбуках 1366×657 / 1280×720 карточки просто листаются */
        "isolate lg:[@media(min-height:780px)]:sticky lg:[@media(min-height:780px)]:top-0",
        paper ? "" : "bg-ink",
      ].join(" ")}
    >
      <div className="grid min-h-[80svh] grid-cols-1 lg:min-h-[88vh] lg:grid-cols-12">
        {/* луп: сверху на телефоне, слева 7/12 на десктопе */}
        <div className="relative lg:col-span-7">
          <CinemaVideo
            loop={c.loop}
            mode="visible"
            orientation="h"
            alt={`${c.title} — ${c.client}`}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="aspect-video lg:absolute lg:inset-0 lg:aspect-auto"
          />
        </div>

        {/* титры */}
        <div className="flex flex-col justify-between gap-8 px-gutter py-8 lg:col-span-5 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <Eyebrow className="whitespace-nowrap">
              [ {num} ] · <span className="hidden sm:inline">ИСТОРИЯ </span>{pad2(i + 1)} / {pad2(total)}
            </Eyebrow>
            <span className="mono-sm max-w-[55%] truncate border border-rule px-2 py-1 text-meta">{format}</span>
          </div>

          <div className="flex flex-col gap-6">
            {/* длинное название («Red Bull Annual Recap» ≈ 7.7em) на десктопе мельче: 4.4vw × 7.7 ≈ 0.34vw — встаёт
                в строку колонки 5/12 без полей (≈ 0.35vw); не влезло (узкий телефон) — две строки с balance, а не вылет */}
            <Reveal
              as="h3"
              className={cn(
                "disp text-h2",
                long ? "[text-wrap:balance] lg:text-[clamp(44px,4.4vw,76px)]" : "whitespace-nowrap lg:text-[clamp(56px,6.6vw,112px)]",
              )}
            >
              <Line>
                <span id={`stacked-${c.slug}`}>{c.title}</span>
              </Line>
            </Reveal>
            <div className="mono text-meta">{meta}</div>

            <div className="grid gap-5">
              {c.task && <Block label="ЗАДАЧА">{c.task}</Block>}
              {c.approach && <Block label="В КАДРЕ">{truncate(c.approach)}</Block>}
              {got && <Block label="ЧТО ПОЛУЧИЛИ">{got}</Block>}
            </div>
          </div>

          <div>
            <Button
              href={`/work/${c.slug}`}
              variant={paper ? "paper" : "outline"}
              size="lg"
              className="w-full sm:w-auto"
            >
              Читать кейс →
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** 05 · Три истории подробно — стопка из трёх избранных кейсов (sticky на десктопе) */
export default function StackedCases({ num = "05" }: { num?: string }) {
  const cases = getCases({ featured: true }).slice(0, 3);
  if (cases.length === 0) return null;
  return (
    <div className="relative">
      {cases.map((c, i) => (
        <Card key={c.slug} c={c} i={i} total={cases.length} num={num} />
      ))}
    </div>
  );
}
