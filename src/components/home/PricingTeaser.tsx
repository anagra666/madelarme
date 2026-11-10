import Link from "next/link";
import { formatPrice, getPricing, settings } from "@/lib/content";
import Button from "@/components/ui/Button";
import { Section, Eyebrow, Container } from "@/components/ui/Section";

/** «·» приклеен неразрывным пробелом к предыдущему пункту — строка не начинается с висячей точки */
const SEP = "\u00a0· ";

/**
 * Состав коллекции одной строкой: «съёмка до 10 ч, 1 оператор · тизер 1:00–1:30, 16:9 + 9:16 · фильм 8–12 мин…».
 * Без ключей значения нечитаемы («1:00–1:30» — это что?); «·» внутри значения → «,», чтобы разделители
 * между пунктами не путались с разделителями внутри. Сроки сдачи — на странице прайса.
 */
function summary(lines: { k: string; v: string }[]): string {
  return lines
    .filter((l) => l.k !== "Сдача")
    .map((l) => `${l.k}\u00a0${l.v.replaceAll(" · ", ", ").replace(/ ([×+]) /g, "\u00a0$1\u00a0").replace(/(\d)–(\d)/g, "$1\u2060–\u2060$2")}`)
    .join(SEP);
}

/** 09 · Сколько стоит — свадебные коллекции строками-титрами, ссылка на весь прайс */
export default function PricingTeaser({ num = "09" }: { num?: string }) {
  const { collections, terms } = getPricing();
  const wedding = collections.filter((c) => c.tab === "wedding");
  if (wedding.length === 0) return null;
  const showPrices = settings.toggles.showPrices;

  return (
    <Section aria-labelledby="pricing-title" className="bg-ink py-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
          <Eyebrow>[ {num} ] · СКОЛЬКО СТОИТ</Eyebrow>
          <span className="mono hidden text-meta lg:block">
            свадьбы · {wedding.length} коллекции{showPrices && settings.toggles.pricesAreDemo && " · цены — демо, до согласования"}
          </span>
        </div>
        <h2 id="pricing-title" className="sr-only">Сколько стоит</h2>
        {/* на телефоне правая подпись скрыта — пометка о демо-ценах отдельной строкой */}
        {showPrices && settings.toggles.pricesAreDemo && <p className="mono-sm -mt-4 mb-6 text-meta lg:hidden">цены — демо, до согласования</p>}

        <ul className="border-b border-rule">
          {wedding.map((c) => (
            <li key={c.slug}>
              <Link
                href="/pricing#wedding"
                className="group grid grid-cols-1 gap-3 border-t border-rule py-5 lg:grid-cols-12 lg:items-baseline lg:gap-x-gutter lg:py-6"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2 lg:col-span-5">
                  <span className="disp text-row transition-colors duration-300 group-hover:text-signal">{c.name}</span>
                  {c.badge && <span className="mono-sm text-signal">{c.badge}</span>}
                </div>
                {showPrices && (
                  <span className="mono text-milk lg:col-span-3 lg:text-right">{formatPrice(c.fromPrice)}</span>
                )}
                <span className={showPrices ? "mono min-w-0 text-meta lg:col-span-4 lg:col-start-9" : "mono min-w-0 text-meta lg:col-span-7"}>
                  {summary(c.lines)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mt-10">
          <Button href="/pricing" variant="outline" size="lg" className="w-full sm:w-auto">
            Весь прайс + бренды ↗
          </Button>
          {terms.length > 0 && <p className="mono-sm max-w-[48ch] text-meta">{terms.map((t) => t.replaceAll(" · ", SEP)).join(SEP)}</p>}
        </div>
      </Container>
    </Section>
  );
}
