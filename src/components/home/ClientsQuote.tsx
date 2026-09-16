import Link from "next/link";
import { getCase, getClients, getTestimonials, settings } from "@/lib/content";
import Marquee from "@/components/ui/Marquee";
import { Fade } from "@/components/ui/Reveal";
import { Section, Eyebrow, Container } from "@/components/ui/Section";

/** 08 · Снимала для + один отзыв. Скрыта флагами showClients / showTestimonials. */
export default function ClientsQuote() {
  const { showClients, showTestimonials } = settings.toggles;
  if (!showClients && !showTestimonials) return null;

  const clients = showClients ? getClients() : [];
  const t = getTestimonials()[0];
  if (clients.length === 0 && !t) return null;

  const unconfirmed = clients.some((c) => !c.confirmed);
  const repeat = Math.max(1, Math.ceil(8 / Math.max(clients.length, 1)));
  const tCase = t?.caseSlug ? getCase(t.caseSlug) : undefined;

  return (
    <Section aria-label="Снимала для и отзыв" className="bg-ink py-[clamp(64px,10vw,160px)]">
      {clients.length > 0 && (
        <div className="border-y border-rule">
          <Marquee duration={36} gap="2.5rem" className="py-4">
            {Array.from({ length: repeat }, (_, r) => (
              <span key={r} className="flex items-center gap-10">
                <span className="mono text-meta">СНИМАЛА ДЛЯ</span>
                {clients.map((c) => (
                  <span key={`${r}-${c.name}`} className="disp text-h3 whitespace-nowrap">
                    {c.name}
                    {!c.confirmed && <sup className="mono ml-1 text-meta">*</sup>}
                    <span aria-hidden="true" className="ml-10 text-meta">·</span>
                  </span>
                ))}
              </span>
            ))}
          </Marquee>
          {unconfirmed && (
            <Container>
              <p className="mono-sm py-2 text-meta">* после подтверждения</p>
            </Container>
          )}
        </div>
      )}

      {t && (
        <Container className="mt-[clamp(48px,7vw,112px)]">
          <Fade>
            <figure className="grid gap-6 lg:grid-cols-12 lg:gap-x-gutter">
              <Eyebrow className="lg:col-span-2">[ ОТЗЫВ ]</Eyebrow>
              <blockquote className="disp text-h3 max-w-[22ch] lg:col-span-10">«{t.quote}»</blockquote>
              <figcaption className="mono flex flex-wrap items-center gap-x-3 gap-y-2 text-meta lg:col-span-10 lg:col-start-3">
                <span className="text-milk">{t.author}</span>
                {t.role && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t.role}</span>
                  </>
                )}
                {tCase && (
                  <>
                    <span aria-hidden="true">·</span>
                    <Link href={`/work/${tCase.slug}`} className="inline-flex min-h-11 items-center text-milk hover:text-signal">
                      смотреть кейс «{tCase.title}» →
                    </Link>
                  </>
                )}
              </figcaption>
            </figure>
          </Fade>
        </Container>
      )}
    </Section>
  );
}
