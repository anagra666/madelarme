import Link from "next/link";
import { countByFormat, getCases, getFormat, getFormats, moods } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";
import { Container, Section } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import WorkIndex from "@/components/home/WorkIndex";
import WorkFilters, { shortLabel, type FilterSelection } from "@/components/work/WorkFilters";

/**
 * Каталог работ без хуков: рендерится и сервером (fallback в <Suspense> на /work — в статическом HTML
 * есть H1 и ссылки на все кейсы), и клиентом из WorkCatalog, который читает фильтры из URL.
 * Невалидные значения фильтров молча игнорируются.
 */
export default function WorkCatalogView({ format: formatParam, mood: moodParam, city: cityParam }: FilterSelection = {}) {
  const all = getCases();
  const formatObj = formatParam ? getFormat(formatParam) : undefined;
  const format = formatObj ? formatParam : undefined;
  const moodObj = moods.find((m) => m.key === moodParam);
  const mood = moodObj?.key;
  const city = cityParam && all.some((c) => c.city === cityParam) ? cityParam : undefined;

  let cases = getCases({ format, mood });
  if (city) cases = cases.filter((c) => c.city === city);

  const formatChips = getFormats()
    .filter((f) => !f.isAddon)
    .map((f) => ({ key: f.slug, label: shortLabel(f.name), count: countByFormat(f.slug) }))
    .filter((f) => f.count > 0);
  const selected: FilterSelection = { format, mood, city };

  /* подпись списка — что именно в нём: «Aftermovie · Дерзкие», без фильтров — «Все работы» */
  const listTitle =
    [formatObj && shortLabel(formatObj.name), moodObj?.label, city].filter(Boolean).join(" · ") || "Все работы";

  return (
    <>
      {/* шапка — такая же Section с зерном, как список ниже: фон стыкуется без полосы, секции не наезжают */}
      <Section className="pt-[calc(var(--header-h)+32px)] lg:pt-[calc(var(--header-h)+64px)]">
        <Container>
          <header className="flex flex-col gap-6 border-b border-rule pb-6 lg:gap-10 lg:pb-8">
            <div className="flex items-end gap-4">
              <h1 className="disp text-h1">Работы</h1>
              <span className="mono mb-[0.35em] text-meta">
                [ {cases.length} / {all.length} ]
              </span>
            </div>
            <WorkFilters formats={formatChips} moods={moods.map((m) => ({ key: m.key, label: m.label }))} total={all.length} selected={selected} />
          </header>
        </Container>
      </Section>

      {cases.length ? (
        <WorkIndex
          cases={cases}
          limit={100}
          showAllLink={false}
          title={listTitle}
          num="01"
          showCounter={false}
          sectionClassName="pt-8 pb-24 lg:pt-12 lg:pb-[clamp(64px,10vw,160px)]"
        />
      ) : (
        <Section className="pb-[calc(var(--sticky-h)+48px)]">
          <Container>
            <div className="flex flex-col items-start gap-4 py-16">
              <p className="disp text-h3">Пока пусто.</p>
              <p className="max-w-[40ch] text-meta">Таких работ ещё нет — но я снимаю такое. Напишите, обсудим.</p>
              <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-6">
                <Button
                  variant="signal"
                  size="lg"
                  href={waLink(formatObj ? prefill("format", formatObj.name) : prefill("home"))}
                >
                  Написать в WhatsApp
                </Button>
                <Link href="/work" scroll={false} className="mono inline-flex h-11 items-center text-milk hover:text-signal">
                  [ сбросить фильтры ]
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
