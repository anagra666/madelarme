import Link from "next/link";
import type { Case } from "@/content/types";
import { moods } from "@/lib/moods";
import { prefill, waLink } from "@/lib/links";
import { pad2 } from "@/lib/utils";
import { Container, Section } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import WorkIndexView, { type IndexRow } from "@/components/home/WorkIndexView";
import WorkFilters, { shortLabel, type FilterSelection } from "@/components/work/WorkFilters";

/** Строка каталога: всё, что нужно клиенту для фильтрации и списка (считается на сервере, см. src/lib/catalog.ts) */
export interface CatalogItem extends Omit<IndexRow, "num"> {
  city?: string;
  /** slug основного формата и дополнительных — по ним работает фильтр */
  format: string;
  extraFormats: string[];
  mood: Case["mood"];
}

export interface CatalogData {
  /** всего опубликованных работ */
  total: number;
  /** опубликованные форматы (в чипы идут только не-addon) */
  formats: { slug: string; name: string; lang?: string; isAddon?: boolean }[];
  items: CatalogItem[];
}

/** то же правило, что у getCases({ format, mood }): основной формат или дополнительный, настроение — среди тегов */
const match = (c: CatalogItem, { format, mood }: { format?: string; mood?: string }) =>
  (!format || c.format === format || c.extraFormats.includes(format)) && (!mood || (c.mood as string[]).includes(mood));

/**
 * Каталог работ без хуков и без импорта контента: рендерится и сервером (fallback в <Suspense> на /work — в статическом HTML
 * есть H1 и ссылки на все кейсы), и клиентом (WorkCatalogClient читает фильтры из URL). Данные приходят готовыми
 * пропсом `data`, поэтому JSON контента в клиентский бандл не попадает.
 * Невалидные значения фильтров молча игнорируются.
 */
export default function WorkCatalogBody({
  data,
  format: formatParam,
  mood: moodParam,
  city: cityParam,
}: { data: CatalogData } & FilterSelection) {
  const all = data.items;
  const formatObj = formatParam ? data.formats.find((f) => f.slug === formatParam) : undefined;
  const format = formatObj ? formatParam : undefined;
  const moodObj = moods.find((m) => m.key === moodParam);
  const mood = moodObj?.key;
  const city = cityParam && all.some((c) => c.city === cityParam) ? cityParam : undefined;

  const inCity = (list: CatalogItem[]) => list.filter((c) => !city || c.city === city);
  const cases = inCity(all.filter((c) => match(c, { format, mood })));

  /* счётчики форматов — при текущих настроении и городе: чип с нулём не показываем (кроме выбранного), он вёл бы в «Пока пусто» */
  const formatChips = data.formats
    .filter((f) => !f.isAddon)
    .map((f) => ({
      key: f.slug,
      label: shortLabel(f.name),
      lang: f.lang,
      count: inCity(all.filter((c) => match(c, { format: f.slug, mood }))).length,
    }))
    .filter((f) => f.count > 0 || f.key === format);
  const totalHere = inCity(all.filter((c) => match(c, { mood }))).length;
  /* сколько работ даст настроение при текущих формате и городе: WorkFilters прячет нулевые, чтобы чип не вёл в «Пока пусто» */
  const moodChips = moods.map((m) => ({
    key: m.key,
    label: m.label,
    count: inCity(all.filter((c) => match(c, { format, mood: m.key }))).length,
  }));
  const selected: FilterSelection = { format, mood, city };

  /* подпись списка — что именно в нём: «Aftermovie · Дерзкие», без фильтров — «Все работы» */
  const listTitle =
    [formatObj && shortLabel(formatObj.name), moodObj?.label, city].filter(Boolean).join(" · ") || "Все работы";

  /* нумерация — после фильтрации */
  const rows: IndexRow[] = cases.map((c, i) => ({
    slug: c.slug,
    num: pad2(i + 1),
    title: c.title,
    client: c.client,
    formatName: c.formatName,
    year: c.year,
    duration: c.duration,
    loop: c.loop,
  }));

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
            <WorkFilters formats={formatChips} moods={moodChips} total={totalHere} selected={selected} />
          </header>
        </Container>
      </Section>

      {cases.length ? (
        <WorkIndexView
          rows={rows}
          total={data.total}
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
