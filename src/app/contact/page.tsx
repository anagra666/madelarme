import type { Metadata } from "next";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead, SectionTitle } from "@/components/pages/PageHead";
import ContactForm from "@/components/pages/ContactForm";
import CopyButton from "@/components/pages/CopyButton";
import StatusLine from "@/components/pages/StatusLine";
import { Faq } from "@/components/pages/Faq";
import { getFaq, getFormats, settings } from "@/lib/content";
import { igDmLink, prefill, telLink, tgLink, waLink } from "@/lib/links";

export const metadata: Metadata = {
  title: "Проверить дату — контакты",
  description: "Напишите, где и когда — отвечу сегодня. WhatsApp, Telegram, Instagram, короткая форма без email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { contacts } = settings;
  const wa = waLink(prefill("contact"));
  const tg = tgLink(prefill("contact"));
  const faq = getFaq("contact").slice(0, 3);

  const main = getFormats().filter((f) => !f.isAddon);
  const formats = main.map((f) => {
    const dup = main.some((o) => o.slug !== f.slug && o.name === f.name);
    return { slug: f.slug, label: dup ? `${f.name} · ${f.term.split(" / ")[0]}` : f.name };
  });

  return (
    <>
      <Section>
        <PageHead title="Проверить дату" sub="напишите, где и когда — отвечу сегодня">
          <StatusLine city={settings.brand.city} season={settings.season} className="mono mt-4 text-signal" />
        </PageHead>
      </Section>

      <Section>
        <Container className="pb-12 md:pb-20">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Button variant="signal" size="xl" href={wa} className="w-full">
              WhatsApp
            </Button>
            <Button variant="outline" size="xl" href={tg} className="w-full">
              Telegram
            </Button>
            <Button variant="outline" size="xl" href={igDmLink()} className="w-full">
              Instagram
            </Button>
          </div>

          <dl className="mono mt-8 grid grid-cols-1 gap-y-4 border-t border-rule pt-6 md:grid-cols-2">
            <div className="flex flex-wrap items-center gap-3">
              <dt className="text-meta">e-mail</dt>
              <dd className="flex items-center gap-3">
                <a href={`mailto:${contacts.email}`} className="normal-case underline-offset-4 hover:text-signal hover:underline">
                  {contacts.email}
                </a>
                <CopyButton text={contacts.email} />
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <dt className="text-meta">телефон</dt>
              <dd>
                <a href={telLink()} className="inline-flex min-h-11 items-center tabular-nums underline-offset-4 hover:text-signal hover:underline">
                  {contacts.phoneDisplay}
                </a>
              </dd>
            </div>
          </dl>
        </Container>
      </Section>

      <Section className="border-t border-rule">
        <Container className="grid grid-cols-1 gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-4">
            <SectionTitle num="01">Или форма</SectionTitle>
            <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-meta">
              Пять полей, без email. Заявка приходит мне в Telegram — отвечаю в тот же день.
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <ContactForm formats={formats} waHref={wa} />
          </div>
        </Container>
      </Section>

      {faq.length > 0 && (
        <Section paper>
          <Container className="py-14 pb-[calc(56px+var(--sticky-h))] md:py-20 md:pb-[calc(80px+var(--sticky-h))]">
            <SectionTitle num="02">Коротко</SectionTitle>
            <div className="mt-8">
              <Faq items={faq} />
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
