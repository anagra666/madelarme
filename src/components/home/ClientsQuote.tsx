import Link from "next/link";
import { getCase, getClients, getTestimonials, settings } from "@/lib/content";
import Marquee from "@/components/ui/Marquee";
import { Fade } from "@/components/ui/Reveal";
import { Section, Eyebrow, Container } from "@/components/ui/Section";

/**
 * Разделитель «·» перед каждым элементом строки. Ряд сдвинут влево на ширину разделителя внутри
 * обёртки с overflow-x: clip — точка в начале любой строки уезжает за край, висячих «·» нет.
 */
const SEP = "before:inline-block before:w-8 before:text-center before:text-meta before:content-['·']";

/**
 * 08 · Снимала для + один отзыв. Скрыта флагами showClients / showTestimonials.
 * В бегущую строку попадают только подтверждённые клиенты (confirmed) — нет таких, нет и строки.
 */
export default function ClientsQuote() {
  const { showClients, showTestimonials } = settings.toggles;
  if (!showClients && !showTestimonials) return null;

  const clients = showClients ? getClients().filter((c) => c.confirmed) : [];
  const t = getTestimonials()[0];
  if (clients.length === 0 && !t) return null;

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
                    <span aria-hidden="true" className="ml-10 text-meta">·</span>
                  </span>
                ))}
              </span>
            ))}
          </Marquee>
        </div>
      )}

      {t && (
        <Container className={clients.length > 0 ? "mt-[clamp(48px,7vw,112px)]" : undefined}>
          <Fade>
            <figure className="grid gap-6 lg:grid-cols-12 lg:gap-x-gutter">
              <Eyebrow className="lg:col-span-2">[ 08 ] · ОТЗЫВ</Eyebrow>
              <blockquote className="disp text-h3 max-w-[22ch] lg:col-span-10">«{t.quote}»</blockquote>
              <figcaption className="mono overflow-x-clip text-meta lg:col-span-10 lg:col-start-3">
                <div className="-ml-8 flex flex-wrap items-center gap-y-2">
                  <span className={`${SEP} text-milk`}>{t.author}</span>
                  {t.role && <span className={SEP}>{t.role.replaceAll(" · ", "\u00a0· ")}</span>}
                  {!t.confirmed && <span className={SEP}>[ демо ]</span>}
                  {tCase && (
                    <span className={SEP}>
                      <Link href={`/work/${tCase.slug}`} className="inline-flex min-h-11 items-center text-milk hover:text-signal">
                        смотреть кейс «{tCase.title}» →
                      </Link>
                    </span>
                  )}
                </div>
              </figcaption>
            </figure>
          </Fade>
        </Container>
      )}
    </Section>
  );
}
