import type { Metadata } from "next";
import Link from "next/link";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead } from "@/components/pages/PageHead";
import ShowreelBlock, { WatchFilmButton } from "@/components/pages/ShowreelBlock";
import { realFilm } from "@/components/work/film";
import { getCases, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";
import { cn, isLongTitle, pad2, titleWrap } from "@/lib/utils";

const { brand } = settings;
const featured = getCases({ featured: true });

/* описание — только из фактов: кто, где и какие работы на странице (без хронометража несуществующего рила) */
export const metadata: Metadata = {
  title: "Шоурил",
  description: [
    `${brand.person}, ${brand.role} · ${brand.city}.`,
    featured.length > 0 && `Избранные работы: ${featured.map((c) => c.title).join(", ")}.`,
  ]
    .filter(Boolean)
    .join(" "),
  alternates: { canonical: "/showreel" },
};

/**
 * Шоурил: луп-монтаж без звука + избранные работы. У строки с настоящим фильмом — «▶ смотреть MM:SS»
 * (фильм кейса в Player), сама строка ведёт на кейс. Полный фильм-шоурил появится, когда будет в settings.showreel.film.
 */
export default function ShowreelPage() {
  const reel = settings.showreel;
  const film = realFilm(reel?.film);

  return (
    <>
      <Section>
        <PageHead title="Шоурил" sub={[brand.person, brand.city, film?.duration].filter(Boolean).join(" · ")} />
      </Section>

      <Section>
        <Container className="pb-12 md:pb-20">
          {reel ? (
            <ShowreelBlock loop={reel.loop} film={film} title="Шоурил" />
          ) : (
            <p className="mono border-y border-rule py-10 text-center text-meta">шоурил появится здесь</p>
          )}
        </Container>
      </Section>

      {featured.length > 0 && (
        <Section>
          <Container className="py-12 md:py-20">
            <p className="mono text-meta">[ избранные работы ]</p>
            <ol className="mt-6 border-t border-rule">
              {featured.map((c, i) => {
                const caseFilm = realFilm(c.fullVideo);
                return (
                  <li key={c.slug} className="flex min-h-14 items-center gap-4 border-b border-rule md:gap-8">
                    <Link href={`/work/${c.slug}`} className="group flex min-w-0 flex-1 items-center gap-4 self-stretch py-3 md:gap-8">
                      <span className="mono w-8 shrink-0 text-meta tabular-nums">{pad2(i + 1)}</span>
                      <span className={cn(
                          "disp min-w-0 flex-1 transition-colors duration-300 group-hover:text-signal",
                          titleWrap(c.title),
                          /* длинное название на телефоне мельче, чтобы «ANNUAL RECAP» влезало в колонку; с md — как короткие */
                          isLongTitle(c.title) ? "text-[clamp(26px,8.5vw,32px)] md:text-h3" : "text-h3",
                        )}>
                        {c.title}
                      </span>
                      {c.client !== c.title && <span className="mono hidden shrink-0 text-meta md:block">{c.client}</span>}
                      <span aria-hidden="true" className="mono text-meta transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-signal">→</span>
                    </Link>
                    {caseFilm && <WatchFilmButton video={caseFilm} title={c.title} />}
                  </li>
                );
              })}
            </ol>
          </Container>
        </Section>
      )}

      <Section>
        <Container className="flex flex-col items-start gap-6 py-12 pb-[calc(64px+var(--sticky-h))] md:py-20 md:pb-[calc(96px+var(--sticky-h))]">
          <p className="disp text-h2">Хочу так же</p>
          <Button variant="signal" size="xl" href={waLink(prefill("home"))} className="w-full sm:w-auto">
            Обсудить съёмку · WhatsApp
          </Button>
        </Container>
      </Section>
    </>
  );
}
