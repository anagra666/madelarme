import type { Metadata } from "next";
import Link from "next/link";
import { countByFormat, getCases, getFormat, getFormats, moods } from "@/lib/content";
import { Container, Section } from "@/components/ui/Section";
import WorkFilters, { type FilterSelection } from "@/components/work/WorkFilters";
/* INTEGRATOR: заменить на  import WorkIndex from "@/components/home/WorkIndex";  когда появится */
import WorkIndex from "@/components/work/WorkListFallback";

export const metadata: Metadata = {
  title: "Работы",
  description: "Все работы Марии Волковой: свадебные фильмы, клипы, aftermovie, бренд-видео. Фильтр по формату и настроению.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function WorkPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const formatParam = one(sp.format);
  const moodParam = one(sp.mood);
  const cityParam = one(sp.city);

  const format = formatParam && getFormat(formatParam) ? formatParam : undefined;
  const mood = moods.some((m) => m.key === moodParam) ? moodParam : undefined;
  const view: FilterSelection["view"] = one(sp.view) === "grid" ? "grid" : "list";

  const all = getCases();
  const city = cityParam && all.some((c) => c.city === cityParam) ? cityParam : undefined;

  let cases = getCases({ format, mood });
  if (city) cases = cases.filter((c) => c.city === city);

  const formatChips = getFormats()
    .filter((f) => !f.isAddon)
    .map((f) => ({ key: f.slug, label: f.name, count: countByFormat(f.slug) }))
    .filter((f) => f.count > 0);

  const selected: FilterSelection = { format, mood, view, city };

  return (
    <Section className="pt-[calc(var(--header-h)+32px)] pb-[calc(var(--sticky-h)+48px)] lg:pt-[calc(var(--header-h)+64px)]">
      <Container>
        <header className="flex flex-col gap-6 border-b border-rule pb-6 lg:gap-10 lg:pb-8">
          <div className="flex items-end gap-4">
            <h1 className="disp text-h1">Работы</h1>
            <span className="mono mb-[0.35em] text-meta">
              [ {cases.length} / {all.length} ]
            </span>
          </div>
          <WorkFilters
            formats={formatChips}
            moods={moods.map((m) => ({ key: m.key, label: m.label }))}
            total={all.length}
            selected={selected}
          />
        </header>

        <div className="pt-8 lg:pt-12">
          {cases.length ? (
            <WorkIndex cases={cases} limit={100} showAllLink={false} title="[ Все работы ]" view={view} />
          ) : (
            <div className="flex flex-col items-start gap-4 py-16">
              <p className="disp text-h3">Пока пусто.</p>
              <p className="max-w-[40ch] text-meta">Таких работ ещё нет — но я снимаю такое. Напишите, обсудим.</p>
              <Link href="/work" scroll={false} className="mono inline-flex h-11 items-center text-milk hover:text-signal">
                [ сбросить фильтры ]
              </Link>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
