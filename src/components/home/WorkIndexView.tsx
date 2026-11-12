import Image from "next/image";
import Link from "next/link";
import { small } from "@/lib/media";
import { cn, isLongTitle, pad2 } from "@/lib/utils";
import { Section, Container } from "@/components/ui/Section";
import WorkIndexDesktop, { type IndexRow } from "./WorkIndex.client";

export type { IndexRow };

/**
 * Индекс работ (план §05 / §07-03), презентационная часть: получает готовые строки и ничего не знает о контенте,
 * поэтому её можно импортировать из клиентских компонентов (каталог /work) без JSON в бандле.
 * Десктоп: список с лупом за строками или сетка (WorkIndex.client).
 * Телефон: строки 112px с кадром 9:16 справа (только постер — полный 720×1280 луп ради плашки 56px
 * не качаем; берём малую копию -s). Переиспользуется на /work через пропсы.
 */
export default function WorkIndexView({
  rows,
  total,
  showAllLink = true,
  title = "ИЗБРАННЫЕ РАБОТЫ",
  num = "03",
  sectionClassName,
  showCounter = true,
}: {
  rows: IndexRow[];
  /** всего опубликованных работ — для «ВСЕ РАБОТЫ (N)» */
  total: number;
  showAllLink?: boolean;
  title?: string;
  /** номер секции в моно-подписи: [ 03 ] · ИЗБРАННЫЕ РАБОТЫ */
  num?: string;
  /** переопределить отступы секции (на /work верхний отступ меньше, без отрицательных margin) */
  sectionClassName?: string;
  /** счётчик «[ 06 / 11 ]» у подписи; на /work он уже стоит у H1 */
  showCounter?: boolean;
}) {
  if (rows.length === 0) return null;
  const counter = showCounter ? `${pad2(rows.length)} / ${pad2(total)}` : "";
  const eyebrow = `[ ${num} ] · ${title}`;

  return (
    <Section id="work" aria-labelledby="work-title" className={cn("py-[clamp(64px,10vw,160px)]", sectionClassName)}>
      <Container>
        <h2 id="work-title" className="sr-only">{title}</h2>

        <WorkIndexDesktop rows={rows} eyebrow={eyebrow} counter={counter} total={total} showAllLink={showAllLink} />

        {/* ── телефон: две строки текста + кадр справа, tap = кейс ── */}
        <div className="lg:hidden">
          {/* items-start + min-w-0: на 320 подпись переносится на вторую строку, счётчик остаётся справа сверху */}
          <header className="mono flex items-start justify-between gap-4 text-meta">
            <span className="min-w-0">{eyebrow}</span>
            {counter && <span className="shrink-0">[ {counter} ]</span>}
          </header>
          <ul className="mt-6 border-b border-rule">
            {rows.map((r) => (
              <li key={r.slug} className="border-t border-rule">
                <div className="cq relative grid h-28 grid-cols-[minmax(0,1fr)_56px] items-center gap-3">
                  <Link
                    href={`/work/${r.slug}`}
                    prefetch={false}
                    className="block min-w-0 active:text-signal after:absolute after:inset-0 after:z-10 after:content-['']"
                  >
                    {/* город почти у всех «Алматы» — в узкой строке важнее длительность: номер, год и длительность не сжимаются,
                        многоточие получает только название формата (NBSP вокруг точек — иначе пробел в flex-элементе схлопывается) */}
                    <span className="mono-sm flex min-w-0 normal-case text-meta">
                      <span className="shrink-0">{r.num}{"\u00a0·\u00a0"}</span>
                      <span className="min-w-0 truncate">{r.formatName.toLowerCase()}</span>
                      <span className="shrink-0">{[r.year, r.duration].filter(Boolean).map((v) => `\u00a0·\u00a0${v}`).join("")}</span>
                    </span>
                    {/* overflow-x-clip, не hidden: по вертикали бреве «Й»/«Ё» выходит за строку (.disp lh .86) */}
                    <span
                      className={cn(
                        "disp mt-2 block overflow-x-clip whitespace-nowrap",
                        isLongTitle(r.title) ? "text-[8.5cqw]" : "text-[11cqw]",
                      )}
                    >
                      {r.title}
                    </span>
                  </Link>
                  <Image
                    src={small(r.loop.posterV ?? r.loop.posterH)}
                    alt=""
                    width={56}
                    height={100}
                    sizes="56px"
                    className="h-[100px] w-14 shrink-0 border border-rule bg-ink-2 object-cover"
                  />
                </div>
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
