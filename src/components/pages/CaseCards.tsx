import Link from "next/link";
import type { Case } from "@/content/types";
import CaseCardMedia from "@/components/pages/CaseCardMedia";
import { cn, pad2, titleWrap } from "@/lib/utils";

/**
 * Карточки кейсов: на телефоне — rail со scroll-snap (следующая видна полукадром),
 * на десктопе — сетка 3 колонки. Не более 6 лупов в секции.
 * Длинное название в колонке 1/3 (text-h3) переносится на две строки с balance; пустые город/год из подписи выпадают.
 */
export function CaseCards({ cases, emptyText = "работы этого формата появятся здесь" }: { cases: Case[]; emptyText?: string }) {
  if (!cases.length) {
    return (
      <p className="mono border-y border-rule py-10 text-center text-meta">{emptyText}</p>
    );
  }
  return (
    <ul className="rail -mx-gutter md:mx-0 md:grid md:grid-cols-3 md:gap-x-4 md:gap-y-10 md:overflow-visible md:px-0">
      {cases.slice(0, 6).map((c, i) => (
        <li key={c.slug} className="w-[78vw] max-w-[420px] md:w-auto md:max-w-none">
          <Link href={`/work/${c.slug}`} className="group block">
            <CaseCardMedia loop={c.loop} alt={c.title} className="relative aspect-video w-full" />
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-rule pt-3">
              <span className={cn("disp text-h3 min-w-0 transition-colors duration-300 group-hover:text-signal", titleWrap(c.title))}>
                {c.title}
              </span>
              <span className="mono shrink-0 text-meta">{pad2(i + 1)}</span>
            </div>
            <div className="mono-sm mt-1 truncate text-meta">{[c.client, c.city, c.year].filter(Boolean).join(" · ")}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
