import Link from "next/link";
import { collectionPrice, getPricing, settings } from "@/lib/content";
import Button from "@/components/ui/Button";
import { nb } from "@/lib/typo";
import { Section, Eyebrow, Container } from "@/components/ui/Section";

/**
 * 09 · Сколько стоит — тарифы строками-титрами: час / полдня / весь день и ролики для соцсетей.
 * Состав тарифа, доплаты и подробности — на странице прайса; здесь название и цена, под списком условия строками.
 */
export default function PricingTeaser({ num = "09" }: { num?: string }) {
  const { collections, terms } = getPricing();
  if (collections.length === 0) return null;
  const showPrices = settings.toggles.showPrices;
  const demo = showPrices && settings.toggles.pricesAreDemo;

  return (
    <Section aria-labelledby="pricing-title" className="bg-ink py-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
          <Eyebrow>[ {num} ] · СКОЛЬКО СТОИТ</Eyebrow>
          <span className="mono hidden text-meta lg:block">
            по времени съёмки · ролики поштучно{demo && " · цены — демо, до согласования"}
          </span>
        </div>
        <h2 id="pricing-title" className="sr-only">Сколько стоит</h2>
        {/* на телефоне правая подпись скрыта — пометка о демо-ценах отдельной строкой */}
        {demo && <p className="mono-sm -mt-4 mb-6 text-meta lg:hidden">цены — демо, до согласования</p>}

        <ul className="border-b border-rule">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/pricing#${c.slug}`}
                className="group grid grid-cols-1 gap-3 border-t border-rule py-5 lg:grid-cols-12 lg:items-baseline lg:gap-x-gutter lg:py-6"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2 lg:col-span-7">
                  <span className="disp text-row transition-colors duration-300 group-hover:text-signal">{c.name}</span>
                  {c.badge && <span className="mono-sm text-signal">{c.badge}</span>}
                </div>
                <span className="price text-milk lg:col-span-5 lg:text-right">
                  {collectionPrice(c)}
                  {showPrices && c.unit && <span className="mono text-meta"> {c.unit}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between lg:mt-10">
          <Button href="/pricing" variant="outline" size="lg" className="w-full sm:w-auto">
            Весь прайс ↗
          </Button>
          {terms.length > 0 && (
            <ul className="mono-lg w-full text-milk/85 sm:max-w-[60ch]">
              {terms.map((t) => (
                <li key={t} className="border-b border-rule py-2.5 first:border-t">
                  {nb(t)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </Section>
  );
}
