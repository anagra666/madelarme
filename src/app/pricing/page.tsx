import type { Metadata } from "next";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead, SectionTitle } from "@/components/pages/PageHead";
import PricingTabs from "@/components/pages/PricingTabs";
import { PriceCard } from "@/components/pages/PriceCard";
import { Faq } from "@/components/pages/Faq";
import { getFaq, getPricing, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";

export const metadata: Metadata = {
  title: "Цены — свадебный видеограф, бренды и контент · Алматы",
  description: "Открытые цены в результатах: коллекции Утро / Весь день / Той, форматы для брендов и контента, допы и условия. Бронь даты — договор и предоплата 30%.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const { collections, extras, terms } = getPricing();
  const wedding = collections.filter((c) => c.tab === "wedding");
  const brand = collections.filter((c) => c.tab === "brand");
  const faq = getFaq("pricing");

  const grid = (list: typeof collections) => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {list.map((c) => (
        <PriceCard key={c.slug} c={c} />
      ))}
    </div>
  );

  return (
    <>
      <Section>
        <PageHead title="Цены" sub="в результатах, а не в камерах и часах">
          {settings.toggles.showPlaceholders && (
            <p className="mono-sm mt-6 text-signal">все цифры — плейсхолдеры до утверждения</p>
          )}
        </PageHead>
      </Section>

      <Section>
        <Container className="pb-16 md:pb-24">
          <PricingTabs
            tabs={[
              { key: "wedding", label: "Свадьбы", content: grid(wedding) },
              {
                key: "brand",
                label: "Бренды и контент",
                content: (
                  <>
                    {grid(brand)}
                    <p className="mono mt-8 text-meta">Крупные проекты — индивидуально, смета за 2 дня.</p>
                  </>
                ),
              },
            ]}
          />
          <p className="mt-8 max-w-[52ch] text-[15px] leading-relaxed text-meta">
            Второй оператор — только там, где он реально нужен: на церемонии и большом тое. И я скажу где.
          </p>
        </Container>
      </Section>

      <Section paper>
        <Container className="py-14 md:py-20">
          <SectionTitle num="01">Дополнительно</SectionTitle>
          <dl className="mono mt-8 border-t border-rule">
            {extras.map((x) => (
              <div key={x.name} className="grid min-h-12 grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-rule py-3">
                <dt>
                  {x.name}
                  {x.note && <span className="text-meta"> · {x.note}</span>}
                </dt>
                <dd className="text-right tabular-nums">{x.price}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section paper className="border-t border-rule-paper">
        <Container className="py-14 md:py-20">
          <SectionTitle num="02">Условия</SectionTitle>
          <ul className="mt-8 border-t border-rule">
            {terms.map((t) => (
              <li key={t} className="border-b border-rule py-5 font-mono text-[clamp(16px,2.4vw,28px)] uppercase leading-tight tracking-[0.06em] md:py-7">
                {t}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section paper className="border-t border-rule-paper">
        <Container className="py-14 md:py-20">
          <SectionTitle num="03">Вопросы</SectionTitle>
          <div className="mt-8">
            <Faq items={faq} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col items-start gap-6 py-16 pb-[calc(64px+var(--sticky-h))] md:py-24 md:pb-[calc(96px+var(--sticky-h))]">
          <p className="disp text-h2">Дата свободна?</p>
          <p className="mono text-meta">напишите дату и город — отвечу сегодня</p>
          <Button variant="signal" size="xl" href={waLink(prefill("contact"))}>
            Проверить дату · WhatsApp
          </Button>
        </Container>
      </Section>
    </>
  );
}
