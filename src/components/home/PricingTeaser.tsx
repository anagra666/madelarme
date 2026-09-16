import Link from "next/link";
import { formatPrice, getPricing, settings } from "@/lib/content";
import Button from "@/components/ui/Button";
import { Section, Eyebrow, Container } from "@/components/ui/Section";

/** 09 · Сколько стоит — свадебные коллекции строками-титрами, ссылка на весь прайс */
export default function PricingTeaser() {
  const { collections, terms } = getPricing();
  const wedding = collections.filter((c) => c.tab === "wedding");
  if (wedding.length === 0) return null;
  const showPrices = settings.toggles.showPrices;

  return (
    <Section aria-labelledby="pricing-title" className="bg-ink py-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
          <Eyebrow>[ 09 ] · СКОЛЬКО СТОИТ</Eyebrow>
          <span className="mono hidden text-meta lg:block">свадьбы · {wedding.length} коллекции</span>
        </div>
        <h2 id="pricing-title" className="sr-only">Сколько стоит</h2>

        <ul className="border-b border-rule">
          {wedding.map((c) => (
            <li key={c.slug}>
              <Link
                href="/pricing#wedding"
                className="group grid grid-cols-1 gap-3 border-t border-rule py-5 lg:grid-cols-12 lg:items-baseline lg:gap-x-gutter lg:py-6"
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 lg:col-span-5">
                  <span className="disp text-row transition-colors duration-300 group-hover:text-signal">{c.name}</span>
                  {c.badge && <span className="mono-sm text-signal">{c.badge}</span>}
                </div>
                {showPrices && (
                  <span className="mono text-milk lg:col-span-3 lg:text-right">{formatPrice(c.fromPrice)}</span>
                )}
                <span className={showPrices ? "mono text-meta lg:col-span-4 lg:col-start-9" : "mono text-meta lg:col-span-7"}>
                  {c.lines.map((l) => l.v).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mt-10">
          <Button href="/pricing" variant="outline" size="lg" className="w-full sm:w-auto">
            Весь прайс + бренды ↗
          </Button>
          {terms.length > 0 && <p className="mono-sm max-w-[48ch] text-meta">{terms.join(" · ")}</p>}
        </div>
      </Container>
    </Section>
  );
}
