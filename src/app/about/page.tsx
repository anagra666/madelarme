import type { Metadata } from "next";
import Image from "next/image";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { Reveal, Line } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/pages/PageHead";
import { ProcessList } from "@/components/pages/ProcessList";
import { getClients, settings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Я Маша — видеограф в Алматы",
  description: settings.about.paragraphs[0],
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const { about, counters, brand } = settings;
  const clients = settings.toggles.showClients ? getClients() : [];
  const hasUnconfirmed = clients.some((c) => !c.confirmed);

  return (
    <>
      <Section paper>
        <Container className="grid grid-cols-1 gap-10 pt-[calc(var(--header-h)+40px)] pb-14 md:grid-cols-12 md:gap-8 md:pt-[calc(var(--header-h)+72px)] md:pb-24">
          <div className="flex flex-col justify-between gap-10 md:col-span-7">
            <div>
              <h1 className="disp text-h1">Я Маша.</h1>
              <p className="mono mt-5 text-meta md:mt-8">
                [ {brand.role} · {brand.city} ]
              </p>
            </div>
            <p className="max-w-[34ch] text-[19px] leading-[1.4] md:text-[22px]">{settings.heroSub}</p>
          </div>
          {about.portrait && (
            <figure className="md:col-span-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-2">
                <Image
                  src={about.portrait.src}
                  alt={about.portrait.alt}
                  width={about.portrait.w}
                  height={about.portrait.h}
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mono-sm mt-2 text-meta">{brand.person} · {settings.contacts.instagram}</figcaption>
            </figure>
          )}
        </Container>
      </Section>

      <Section>
        <Container className="py-16 md:py-28">
          <Reveal as="h2" className="disp text-h2">
            {settings.manifest.map((line) => (
              <Line key={line}>{line}</Line>
            ))}
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-12">
            <div className="md:col-span-7 md:col-start-6">
              {about.paragraphs.map((p) => (
                <p key={p} className="mb-6 max-w-[60ch] text-[17px] leading-relaxed md:text-[19px]">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {counters && counters.length > 0 && (
        <Section>
          <Container className="py-10 md:py-16">
            <dl className="grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-4">
              {counters.map((c) => (
                <div key={c.label} className="flex min-w-0 flex-col-reverse bg-ink p-5 md:p-8">
                  <dt className="mono mt-2 text-meta">{c.label}</dt>
                  <dd className="disp text-h2 tabular-nums">{c.value}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      )}

      {clients.length > 0 && (
        <Section>
          <Container className="py-14 md:py-20">
            <SectionTitle num="01">Снимала для</SectionTitle>
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {clients.map((c) => (
                <li key={c.name} className="disp text-h3 whitespace-nowrap">
                  {c.name}
                  {!c.confirmed && <span className="text-meta">*</span>}
                </li>
              ))}
            </ul>
            {hasUnconfirmed && <p className="mono-sm mt-6 text-meta">* — демо, до согласования</p>}
          </Container>
        </Section>
      )}

      <Section paper>
        <Container className="py-14 md:py-20">
          <SectionTitle num="02">Как проходит работа</SectionTitle>
          <div className="mt-8 md:mt-12">
            <ProcessList steps={about.process} />
          </div>
        </Container>
      </Section>

      <Section paper className="border-t border-rule-paper">
        <Container className="grid grid-cols-1 gap-12 py-14 md:grid-cols-2 md:py-20">
          <div>
            <SectionTitle num="03">На чём снимаю</SectionTitle>
            <p className="mono mt-6 max-w-[40ch] leading-relaxed">{about.gear}</p>
          </div>
          <div>
            <SectionTitle num="04">Где снимала</SectionTitle>
            <ul className="mt-6 flex flex-wrap gap-2">
              {about.locations.map((l) => (
                <li key={l} className="mono border border-rule px-3 py-2">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col items-start gap-6 py-16 pb-[calc(64px+var(--sticky-h))] md:py-24 md:pb-[calc(96px+var(--sticky-h))]">
          <p className="disp text-h2">Снимем?</p>
          <p className="mono text-meta">{settings.season} · {settings.statusNow}</p>
          <Button variant="signal" size="xl" href="/contact">
            Проверить дату
          </Button>
        </Container>
      </Section>
    </>
  );
}
