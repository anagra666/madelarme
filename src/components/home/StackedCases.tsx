import { getCases, getFormat } from "@/lib/content";
import { pad2 } from "@/lib/utils";
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

function Card({ c, i, total }: { c: Case; i: number; total: number }) {
  const paper = i % 2 === 1;
  const format = getFormat(c.format)?.name ?? c.format;
  const got = c.deliverables.map((d) => `${d.name} ${d.duration}`).join(" · ");

  return (
    <Section
      paper={paper}
      aria-labelledby={`stacked-${c.slug}`}
      style={{ zIndex: i + 1 }}
      className={[
        "isolate lg:sticky lg:top-(--header-h)",
        paper ? "" : "bg-ink",
      ].join(" ")}
    >
      <div className="grid min-h-[80svh] grid-cols-1 lg:h-[88vh] lg:min-h-0 lg:grid-cols-12">
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
              [ 05 ] · <span className="hidden sm:inline">ИСТОРИЯ </span>{pad2(i + 1)} / {pad2(total)}
            </Eyebrow>
            <span className="mono-sm max-w-[55%] truncate border border-rule px-2 py-1 text-meta">{format}</span>
          </div>

          <div className="flex flex-col gap-6">
            <Reveal as="h3" className="disp text-h2 whitespace-nowrap lg:text-[clamp(56px,6.6vw,112px)]">
              <Line>
                <span id={`stacked-${c.slug}`}>{c.title}</span>
              </Line>
            </Reveal>
            <div className="mono text-meta">
              {c.client} · {c.city} · {c.year}
            </div>

            <div className="grid gap-5">
              <Block label="ЗАДАЧА">{c.task}</Block>
              <Block label="ЧТО СНЯЛА">{truncate(c.approach)}</Block>
              <Block label="ЧТО ПОЛУЧИЛИ">{got}</Block>
            </div>
          </div>

          <div>
            <Button
              href={`/work/${c.slug}`}
              variant={paper ? "paper" : "outline"}
              size="lg"
              className={paper ? "w-full [--color-milk:#ece7df] sm:w-auto" : "w-full sm:w-auto"}
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
export default function StackedCases() {
  const cases = getCases({ featured: true }).slice(0, 3);
  if (cases.length === 0) return null;
  return (
    <div className="relative">
      {cases.map((c, i) => (
        <Card key={c.slug} c={c} i={i} total={cases.length} />
      ))}
    </div>
  );
}
