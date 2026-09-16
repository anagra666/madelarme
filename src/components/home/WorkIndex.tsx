import Link from "next/link";
import type { Case } from "@/content/types";
import { getCases, getFormat } from "@/lib/content";
import { cn, pad2 } from "@/lib/utils";
import { Section, Container } from "@/components/ui/Section";
import CinemaVideo from "@/components/media/CinemaVideo";
import WorkIndexDesktop, { type IndexRow } from "./WorkIndex.client";

/**
 * Индекс работ (план §05 / §07-03). Десктоп: список с лупом за строками или сетка (клиент).
 * Телефон: строки 112px с мини-тизером 9:16 (сервер). Переиспользуется на /work через пропсы.
 */
export default function WorkIndex({
  cases,
  limit = 8,
  showAllLink = true,
  title = "ИЗБРАННЫЕ РАБОТЫ",
}: {
  cases?: Case[];
  limit?: number;
  showAllLink?: boolean;
  title?: string;
}) {
  const total = getCases().length;
  const rows = (cases ?? getCases({ featured: true })).slice(0, limit).map(toRow);
  if (rows.length === 0) return null;
  const counter = `${pad2(rows.length)} / ${pad2(total)}`;

  return (
    <Section id="work" aria-labelledby="work-title" className="pb-24 lg:pb-32">
      <Container className="pt-20 lg:pt-32">
        <h2 id="work-title" className="sr-only">{title}</h2>

        <WorkIndexDesktop rows={rows} title={title} counter={counter} total={total} showAllLink={showAllLink} />

        {/* ── телефон: две строки текста + мини-тизер справа, tap = кейс ── */}
        <div className="lg:hidden">
          <header className="mono flex items-center justify-between text-meta">
            <span>[ {title} ]</span>
            <span>[ {counter} ]</span>
          </header>
          <ul className="mt-6 border-b border-rule">
            {rows.map((r) => (
              <li key={r.slug} className="border-t border-rule">
                <Link
                  href={`/work/${r.slug}`}
                  className="cq grid h-28 grid-cols-[minmax(0,1fr)_56px] items-center gap-3 active:text-signal"
                >
                  <span className="min-w-0">
                    <span className="mono-sm block normal-case text-meta">
                      {[r.num, r.formatName.toLowerCase(), r.city, r.year, r.duration].filter(Boolean).join(" · ")}
                    </span>
                    <span
                      className={cn(
                        "disp mt-2 block overflow-hidden whitespace-nowrap",
                        r.title.length > 14 ? "text-[8.5cqw]" : "text-[11cqw]",
                      )}
                    >
                      {r.title}
                    </span>
                  </span>
                  <CinemaVideo
                    loop={r.loop}
                    mode="visible"
                    orientation={r.loop.mp4V ? "v" : "h"}
                    className="h-[100px] w-14 border border-rule"
                    sizes="56px"
                  />
                </Link>
              </li>
            ))}
          </ul>
          {showAllLink && (
            <Link
              href="/work"
              className="mono flex h-14 items-center justify-between border-b border-rule text-milk active:text-signal"
            >
              <span>ВСЕ РАБОТЫ ({total})</span>
              <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}

function toRow(c: Case, i: number): IndexRow {
  return {
    slug: c.slug,
    num: pad2(i + 1),
    title: c.title,
    client: c.client,
    formatName: getFormat(c.format)?.name ?? c.format,
    year: c.year,
    duration: c.fullVideo?.duration,
    city: c.city,
    loop: c.loop,
  };
}
