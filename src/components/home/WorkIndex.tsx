import type { Case } from "@/content/types";
import { getCases, getFormat } from "@/lib/content";
import { pad2 } from "@/lib/utils";
import { realFilm } from "@/components/work/film";
import WorkIndexView, { type IndexRow } from "./WorkIndexView";

/**
 * Индекс работ (план §05 / §07-03), серверная обёртка: берёт кейсы из контента, считает строки
 * и отдаёт их презентационному WorkIndexView. Каталог /work рисует WorkIndexView сам, из готовых строк.
 */
export default function WorkIndex({
  cases,
  limit = 8,
  ...rest
}: {
  cases?: Case[];
  limit?: number;
  showAllLink?: boolean;
  title?: string;
  /** номер секции в моно-подписи: [ 03 ] · ИЗБРАННЫЕ РАБОТЫ */
  num?: string;
  /** переопределить отступы секции (на /work верхний отступ меньше, без отрицательных margin) */
  sectionClassName?: string;
  /** счётчик «[ 06 / 11 ]» у подписи; на /work он уже стоит у H1 */
  showCounter?: boolean;
}) {
  const rows = (cases ?? getCases({ featured: true })).slice(0, limit).map(toRow);
  return <WorkIndexView rows={rows} total={getCases().length} {...rest} />;
}

function toRow(c: Case, i: number): IndexRow {
  return {
    slug: c.slug,
    num: pad2(i + 1),
    title: c.title,
    client: c.client,
    formatName: getFormat(c.format)?.name ?? c.format,
    year: c.year,
    duration: realFilm(c.fullVideo)?.duration,
    loop: c.loop,
  };
}
