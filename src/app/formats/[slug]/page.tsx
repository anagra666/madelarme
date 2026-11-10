import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CinemaVideo from "@/components/media/CinemaVideo";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { SectionTitle } from "@/components/pages/PageHead";
import { CaseCards } from "@/components/pages/CaseCards";
import { Faq } from "@/components/pages/Faq";
import { ProcessList } from "@/components/pages/ProcessList";
import PrefillSetter from "@/components/layout/PrefillSetter";
import { formatPrice, getCases, getFaq, getFormat, getFormats, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";
import { pad2 } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getFormats().map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = getFormat(slug);
  if (!f) return {};
  const cases = getCases({ format: f.slug });
  /* «примеры» — только если на странице есть блок «Работы в этом формате» */
  const title = `${f.seoName ?? f.name} — ${cases.length > 0 ? "цены и примеры" : "цены"} · Алматы`;
  const description = f.intro.length > 160 ? `${f.intro.slice(0, 157)}…` : f.intro;
  const url = `/formats/${f.slug}`;
  /* превью ссылки: свой луп → первая работа формата → луп шоурила */
  const image = f.loop?.posterH ?? cases[0]?.loop.posterH ?? settings.showreel?.loop.posterH;
  return {
    title,
    description,
    alternates: { canonical: url },
    /* openGraph страницы заменяет объект из layout целиком — базовые поля повторяем */
    openGraph: {
      type: "website",
      locale: "ru_KZ",
      siteName: "MADELARME",
      url,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

export default async function FormatPage({ params }: Props) {
  const { slug } = await params;
  const f = getFormat(slug);
  if (!f) notFound();

  const cases = getCases({ format: f.slug }).slice(0, 6);
  const meta = [f.term, f.duration, f.turnaround].filter((x) => x && x !== "—").join(" · ");
  const showPrice = settings.toggles.showPrices;
  /* аддон без своей цены, который сам о себе пишет «Входит во все … коллекции» (тизер) — не «индивидуально» */
  const included = Boolean(f.isAddon && !f.fromPrice && /^входит/i.test(f.intro));
  const priceText = f.fromPrice ? formatPrice(f.fromPrice) : included ? "входит в коллекции" : "индивидуально";

  /* номера разделов по факту рендера: «Как проходит» и «Работы» бывают не у всех форматов */
  let n = 0;
  const num = () => pad2(++n);

  const globalFaq = getFaq(f.group === "wedding" ? "wedding" : "brand");
  const own = f.faq ?? [];
  const faq = [...own, ...globalFaq.filter((g) => !own.some((o) => o.q === g.q))].slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: f.name,
    serviceType: f.term,
    description: f.intro,
    provider: { "@type": "Person", name: settings.brand.person, jobTitle: settings.brand.role },
    areaServed: { "@type": "City", name: settings.brand.city },
    /* несогласованные (демо) цены поисковикам как предложение не отдаём */
    ...(showPrice && f.fromPrice && !settings.toggles.pricesAreDemo
      ? { offers: { "@type": "Offer", priceCurrency: "KZT", price: f.fromPrice, priceSpecification: { "@type": "PriceSpecification", minPrice: f.fromPrice, priceCurrency: "KZT" } } }
      : {}),
  };

  return (
    <>
      <PrefillSetter kind="format" title={f.name} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {f.loop ? (
        <section className="relative flex min-h-[max(60svh,420px)] flex-col justify-end pt-[calc(var(--header-h)+24px)]">
          <CinemaVideo loop={f.loop} priority mode="visible" orientation="auto" className="absolute inset-0" alt={f.name} />
          <div className="scrim-b absolute inset-x-0 bottom-0 h-2/3" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-ink/70 to-transparent" aria-hidden="true" />
          <Container className="relative pb-8 md:pb-12">
            <p className="mono mb-4 self-start text-milk"><span className="bg-ink/50 px-1.5 py-0.5 backdrop-blur-[2px]">
              {f.group === "wedding" ? "01" : f.group === "brand" ? "02" : "03"} · {meta}
            </span></p>
            <h1 className={cn("disp max-w-[14ch] text-balance", f.name.length > 18 ? "text-[clamp(44px,8vw,120px)]" : "text-h1")}>{f.name}</h1>
          </Container>
        </section>
      ) : (
        <Section paper>
          <Container className="pt-[calc(var(--header-h)+40px)] pb-10 md:pt-[calc(var(--header-h)+72px)] md:pb-16">
            <p className="mono mb-4 text-meta">{meta}</p>
            <h1 className="disp text-h1 max-w-[14ch] text-balance">{f.name}</h1>
          </Container>
        </Section>
      )}

      <Section>
        <Container className="py-12 md:py-20">
          <p className="max-w-[30ch] text-[22px] leading-[1.35] md:max-w-[34ch] md:text-[28px]">{f.intro}</p>
        </Container>
      </Section>

      <Section paper>
        <Container className="py-14 md:py-20">
          <SectionTitle num={num()}>Что получаете</SectionTitle>
          <ul className="mt-8 grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2">
            {f.deliverables.map((d, i) => (
              <li key={d} className="flex min-h-28 flex-col justify-between gap-4 bg-paper p-5 sm:last:odd:col-span-2 md:p-6">
                <span className="mono text-meta">[ {pad2(i + 1)} ]</span>
                <span className="text-[19px] font-medium leading-snug md:text-[22px]">{d}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {f.process && f.process.length > 0 && (
        <Section paper className="border-t border-rule-paper">
          <Container className="py-14 md:py-20">
            <SectionTitle num={num()}>Как проходит съёмка</SectionTitle>
            <div className="mt-8">
              <ProcessList steps={f.process.map((p) => ({ step: p }))} />
            </div>
          </Container>
        </Section>
      )}

      {showPrice && (
        <Section>
          <Container className="flex flex-col gap-6 border-b border-rule py-14 md:flex-row md:items-end md:justify-between md:py-20">
            <div>
              <p className="mono text-meta">[ цена ]</p>
              <p className="disp text-h2 mt-3 tabular-nums">{priceText}</p>
              {!f.fromPrice && (
                <p className="mono mt-3 text-meta">{included ? "в любой свадебной коллекции" : "смета за два дня после созвона"}</p>
              )}
              {f.fromPrice && settings.toggles.pricesAreDemo && <p className="mono-sm mt-3 text-meta">цены — демо, до согласования</p>}
            </div>
            <Button variant="outline" size="lg" href={`/pricing#${f.group === "wedding" ? "wedding" : "brand"}`}>
              весь прайс →
            </Button>
          </Container>
        </Section>
      )}

      {cases.length > 0 && (
        <Section>
          <Container className="py-14 md:py-20">
            <SectionTitle num={num()}>Работы в этом формате</SectionTitle>
            <div className="mt-8 md:mt-12">
              <CaseCards cases={cases} />
            </div>
          </Container>
        </Section>
      )}

      {faq.length > 0 && (
        <Section paper>
          <Container className="py-14 md:py-20">
            <SectionTitle num={num()}>Вопросы</SectionTitle>
            <div className="mt-8">
              <Faq items={faq} />
            </div>
          </Container>
        </Section>
      )}

      <Section>
        <Container className="flex flex-col items-start gap-6 py-16 pb-[calc(64px+var(--sticky-h))] md:py-24 md:pb-[calc(96px+var(--sticky-h))]">
          <p className="mono text-meta">[ следующий шаг ]</p>
          <Button variant="signal" size="xl" href={waLink(prefill("format", f.name))} className="max-w-full">
            Хочу обсудить формат<span className="sr-only"> {f.name}</span>
          </Button>
        </Container>
      </Section>
    </>
  );
}
