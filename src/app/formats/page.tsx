import type { Metadata } from "next";
import Link from "next/link";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead, SectionTitle } from "@/components/pages/PageHead";
import { FormatRows } from "@/components/pages/FormatRows";
import { ProcessList } from "@/components/pages/ProcessList";
import { formatGroups, getFormats, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";

export const metadata: Metadata = {
  title: "Форматы съёмки — свадьбы, ивенты, бренды, контент · Алматы",
  description: "Снимаю всё, упор — на репортаж: свадьбы, love story, ивенты, корпоративы, дни рождения, бэкстейджи. Что получаете на руки, цены и сдача монтажа за 2 недели.",
  alternates: { canonical: "/formats" },
};

export default function FormatsPage() {
  return (
    <>
      <Section>
        <PageHead title="Что я снимаю" sub="и что вы получите на руки" />
      </Section>

      {formatGroups.map((g) => {
        const all = getFormats(g.key);
        const main = all.filter((f) => !f.isAddon);
        const addons = all.filter((f) => f.isAddon);
        return (
          <Section key={g.key} id={g.key} className="scroll-mt-(--header-h)">
            <Container className="py-10 md:py-16">
              <SectionTitle num={g.num}>{g.title}</SectionTitle>
              <div className="mt-6 md:mt-10">
                <FormatRows formats={main} />
              </div>
              {addons.length > 0 && (
                <p className="mono mt-4 text-meta">
                  Дополнительно:{" "}
                  {addons.map((a, i) => (
                    <span key={a.slug}>
                      {i > 0 && " · "}
                      <Link href={`/formats/${a.slug}`} className="underline-offset-4 hover:text-signal hover:underline">
                        {a.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </Container>
          </Section>
        );
      })}

      <Section paper>
        <Container className="py-16 md:py-24">
          <SectionTitle num={String(formatGroups.length + 1).padStart(2, "0")}>Как это устроено</SectionTitle>
          <div className="mt-8 md:mt-12">
            <ProcessList steps={settings.about.process} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col items-start gap-6 py-16 pb-[calc(64px+var(--sticky-h))] md:py-24 md:pb-[calc(96px+var(--sticky-h))]">
          <p className="disp text-h2">Не нашли свой формат?</p>
          <p className="mono text-meta">напишите, что хотите снять — разберёмся</p>
          <Button variant="signal" size="xl" href={waLink(prefill("home"))}>
            Обсудить съёмку · WhatsApp
          </Button>
        </Container>
      </Section>
    </>
  );
}
