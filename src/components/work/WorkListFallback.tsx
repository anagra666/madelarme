import Image from "next/image";
import Link from "next/link";
import type { Case } from "@/content/types";
import { getFormat } from "@/lib/content";
import { pad2 } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Section";

/**
 * Простой индекс работ — запасной вариант, пока нет WorkIndex из @/components/home.
 * Те же пропсы, что у WorkIndex: { cases, limit, showAllLink, title } (+ view для /work).
 * Без видео: у /work до 10+ строк, а лимит — ≤8 <CinemaVideo> на секцию. Постер — next/image.
 */
export interface WorkListProps {
  cases: Case[];
  limit?: number;
  showAllLink?: boolean;
  title?: string;
  view?: "list" | "grid";
}

function meta(c: Case): string {
  const f = getFormat(c.format);
  return [c.client, f?.name.toLowerCase(), c.year, c.fullVideo?.duration].filter(Boolean).join(" · ");
}

export default function WorkListFallback({ cases, limit = 100, showAllLink = false, title, view = "list" }: WorkListProps) {
  const list = cases.slice(0, limit);
  return (
    <div>
      {title && <Eyebrow className="mb-4">{title}</Eyebrow>}

      {view === "grid" ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
          {list.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/work/${c.slug}`} className="group block">
                <span className="relative block aspect-video overflow-hidden bg-ink-2">
                  <Image
                    src={c.loop.posterH}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                  />
                </span>
                <span className="mt-3 flex items-baseline gap-3">
                  <span className="mono text-meta">{pad2(i + 1)}</span>
                  <span className="disp text-h3 leading-none group-hover:text-signal">{c.title}</span>
                </span>
                <span className="mono-sm mt-1 block text-meta">{meta(c)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="border-t border-rule">
          {list.map((c, i) => (
            <li key={c.slug} className="border-b border-rule">
              <Link
                href={`/work/${c.slug}`}
                className="group flex flex-col gap-1 py-4 lg:grid lg:grid-cols-12 lg:items-baseline lg:gap-6 lg:py-5"
              >
                <span className="mono text-meta lg:col-span-1">{pad2(i + 1)}</span>
                <span className="disp text-row whitespace-nowrap leading-none transition-colors duration-300 group-hover:text-signal lg:col-span-5">
                  {c.title}
                </span>
                <span className="mono-sm text-meta lg:col-span-5 lg:text-[12px]">{meta(c)}</span>
                <span className="mono hidden text-meta group-hover:text-signal lg:col-span-1 lg:block lg:text-right" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showAllLink && (
        <Link href="/work" className="mono mt-6 inline-flex h-11 items-center text-milk hover:text-signal">
          Все работы ({cases.length}) ↗
        </Link>
      )}
    </div>
  );
}
