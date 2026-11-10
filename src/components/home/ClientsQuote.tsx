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

/** С этого числа клиентов — бегущая строка; меньше — одна статичная строка (одно имя по кругу выглядит пусто) */
const MARQUEE_FROM = 3;

/**
 * Данные секции: только подтверждённые клиенты (confirmed) и первый отзыв.
 * getTestimonials() без showPlaceholders отдаёт только подтверждённые — «[ демо ]» в проде на главную не попадает.
 * null — секции нет (её номер page.tsx не тратит).
 */
export function clientsQuoteData() {
  const { showClients, showTestimonials } = settings.toggles;
  if (!showClients && !showTestimonials) return null;
  const clients = showClients ? getClients().filter((c) => c.confirmed) : [];
  const t = getTestimonials()[0];
  if (clients.length === 0 && !t) return null;
  return { clients, t };
}

/**
 * 08 · Снимала для + один отзыв. Скрыта флагами showClients / showTestimonials.
 * Номер секции стоит у первого блока: у строки клиентов, а без клиентов — у отзыва.
 */
export default function ClientsQuote({ num = "08" }: { num?: string }) {
  const data = clientsQuoteData();
  if (!data) return null;
  const { clients, t } = data;

  const names = clients.map((c) => c.name);
  const marquee = clients.length >= MARQUEE_FROM;
  const repeat = Math.max(1, Math.ceil(8 / Math.max(clients.length, 1)));
  const tCase = t?.caseSlug ? getCase(t.caseSlug) : undefined;
  const label = clients.length === 0 ? "Отзыв" : t ? "Снимала для и отзыв" : "Снимала для";

  return (
    /* одна статичная строка без отзыва: нижний отступ отдаём следующей секции, иначе между ними пустая полоса */
    <Section aria-label={label} className={`bg-ink pt-[clamp(64px,10vw,160px)] ${t || marquee ? "pb-[clamp(64px,10vw,160px)]" : "pb-0"}`}>
      {marquee && (
        <>
          <Container className="mb-6">
            <Eyebrow>[ {num} ] · СНИМАЛА ДЛЯ</Eyebrow>
          </Container>
          <div className="border-y border-rule">
            <Marquee duration={36} gap="2.5rem" className="py-4">
              {Array.from({ length: repeat }, (_, r) => (
                <span key={r} className="flex items-center gap-10">
                  {names.map((name) => (
                    <span key={`${r}-${name}`} className="disp text-h3 whitespace-nowrap">
                      {name}
                      <span aria-hidden="true" className="ml-10 text-meta">·</span>
                    </span>
                  ))}
                </span>
              ))}
            </Marquee>
          </div>
        </>
      )}

      {clients.length > 0 && !marquee && (
        <Container>
          <div className="flex flex-col gap-3 border-y border-rule py-6 lg:flex-row lg:items-baseline lg:gap-10 lg:py-8">
            <Eyebrow className="shrink-0 whitespace-nowrap">[ {num} ] · СНИМАЛА ДЛЯ</Eyebrow>
            <p className="disp text-h3">{names.join(" · ")}</p>
          </div>
        </Container>
      )}

      {t && (
        <Container className={clients.length > 0 ? "mt-[clamp(48px,7vw,112px)]" : undefined}>
          <Fade>
            <figure className="grid gap-6 lg:grid-cols-12 lg:gap-x-gutter">
              <Eyebrow className="lg:col-span-2">{clients.length > 0 ? "[ ОТЗЫВ ]" : `[ ${num} ] · ОТЗЫВ`}</Eyebrow>
              <blockquote className="disp text-h3 max-w-[22ch] lg:col-span-10">«{t.quote}»</blockquote>
              <figcaption className="mono overflow-x-clip text-meta lg:col-span-10 lg:col-start-3">
                <div className="-ml-8 flex flex-wrap items-center gap-y-2">
                  <span className={`${SEP} text-milk`}>{t.author}</span>
                  {t.role && <span className={SEP}>{t.role.replaceAll(" · ", " · ")}</span>}
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
