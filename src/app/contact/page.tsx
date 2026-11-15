import type { Metadata } from "next";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead, SectionTitle } from "@/components/pages/PageHead";
import ContactForm from "@/components/pages/ContactForm";
import CopyButton from "@/components/pages/CopyButton";
import StatusLine, { FreeSaturdays } from "@/components/pages/StatusLine";
import PrefillSetter from "@/components/layout/PrefillSetter";
import { Faq } from "@/components/pages/Faq";
import { getFaq, getFormatChips, settings } from "@/lib/content";
import { STATIC_SITE } from "@/lib/lead";
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

  const formats = getFormatChips();

  return (
    <>
      <PrefillSetter kind="contact" />
      <Section>
        <PageHead title="Проверить дату" sub="напишите, где и когда — отвечу сегодня">
          <StatusLine city={settings.brand.city} season={settings.season} className="mono mt-4 text-milk" />
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
                <a href={`mailto:${contacts.email}`} className="inline-flex min-h-11 items-center normal-case underline-offset-4 hover:text-signal hover:underline">
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

          {/* занятость: только при settings.toggles.showAvailability и свежем списке, иначе ничего */}
          <FreeSaturdays className="mt-8" />
        </Container>
      </Section>

      <Section className="border-t border-rule">
        <Container className="grid grid-cols-1 gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-4 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <SectionTitle num="01">Или форма</SectionTitle>
            <p className="mt-4 max-w-[36ch] text-[16px] leading-relaxed text-milk/80">
              {STATIC_SITE
                ? "Пять полей, без email. Заявка откроется в WhatsApp уже заполненной — останется нажать «Отправить». Отвечаю в тот же день."
                : "Пять полей, без email. Заявка приходит мне в Telegram — отвечаю в тот же день."}
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <ContactForm formats={formats} waHref={wa} />
          </div>
        </Container>
      </Section>

      {faq.length > 0 && (
        <Section paper>
          <Container className="py-14 md:py-20">
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
