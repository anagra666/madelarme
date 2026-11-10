import type { Metadata } from "next";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead, SectionTitle } from "@/components/pages/PageHead";
import { PriceCard } from "@/components/pages/PriceCard";
import { Faq } from "@/components/pages/Faq";
import PrefillSetter from "@/components/layout/PrefillSetter";
import { getFaq, getPricing, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";

export const metadata: Metadata = {
  title: "Цены на видеосъёмку — час, полдня, весь день · Алматы",
  description: "Сколько стоит съёмка: час, полдня или весь день, ролики для соцсетей — поштучно. Доплаты, сроки сдачи монтажа и способы оплаты.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const { collections, extras, terms } = getPricing();
  const faq = getFaq("pricing");

  return (
    <>
      {/* prefill("pricing") требует название тарифа ({title}); для страницы в целом — «Хочу проверить дату» */}
      <PrefillSetter kind="contact" />
      <Section>
        <PageHead title="Цены" sub="по времени съёмки, ролики для соцсетей — поштучно">
          {/* свой флаг, а не showPlaceholders: демо-кейсы уже скрыты, а цены могут быть ещё не согласованы */}
          {settings.toggles.pricesAreDemo && (
            <p className="mono-sm mt-6 text-meta">цены — демо, до согласования</p>
          )}
        </PageHead>
      </Section>

      <Section>
        <Container className="pb-16 md:pb-24">
          {/* sr-only h2 — чтобы между H1 «Цены» и h3 карточек не было пропуска уровня */}
          <h2 className="sr-only">Тарифы</h2>
          {/* час / полдня / весь день и ролики для соцсетей — одной строкой карточек; якоря #time и #unit
              (ссылки со страниц форматов) — на первой карточке своей модели */}
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {collections.map((c, i) => (
              <PriceCard key={c.slug} c={c} id={collections.findIndex((x) => x.tab === c.tab) === i ? c.tab : undefined} />
            ))}
          </div>
        </Container>
      </Section>

      <Section paper>
        <Container className="py-14 md:py-20">
          <SectionTitle num="01">Дополнительно</SectionTitle>
          <dl className="mono mt-8 border-t border-rule">
            {extras.map((x) => (
              <div key={x.name} className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 md:gap-x-6 border-b border-rule py-3">
                <dt className="min-w-0">
                  {x.name}
                  {x.note && <span className="text-meta"> · {x.note}</span>}
                </dt>
                <dd className="text-right tabular-nums">{x.price}</dd>
              </div>
            ))}
          </dl>
          <p className="mono mt-6 text-meta">проценты — к стоимости проекта</p>
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
          <p className="mono text-meta">напишите дату и город — отвечаю быстро</p>
          <Button variant="signal" size="xl" href={waLink(prefill("contact"))}>
            Проверить дату · WhatsApp
          </Button>
        </Container>
      </Section>
    </>
  );
}
