import type { Case } from "@/content/types";
import { pad2 } from "@/lib/utils";
import { Fade, Line, Reveal } from "@/components/ui/Reveal";
import Ledger, { type LedgerRow } from "@/components/work/Ledger";

/**
 * Тело кейса. Десктоп: 12 колонок — слева sticky ledger («Что получили», «Съёмка», «Пост»),
 * справа главы [ 01 ] Задача · [ 02 ] В кадре (что в фильме) · [ 03 ] Результат.
 * Телефон: одна колонка — главы первыми, ledger следом.
 * Пустые факты не выводятся: строки ledger без значения, пустые ledger и главы без текста пропадают,
 * номера глав идут подряд.
 */
function Chapter({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule pt-6 lg:pt-8">
      <Reveal as="h2" className="mb-5 flex flex-wrap items-baseline gap-x-4">
        <Line className="mono text-meta">[ {num} ]</Line>
        <Line className="disp text-h3">{title}</Line>
      </Reveal>
      <Fade>{children}</Fade>
    </div>
  );
}

export default function CaseBody({ c }: { c: Case }) {
  const deliverables: LedgerRow[] = c.deliverables.map((d) => ({
    k: d.name,
    v: [d.duration, d.aspect].filter(Boolean).join(" · "),
    note: d.note,
  }));

  const s = c.shooting;
  const shooting = ([
    s?.days ? { k: "Дни", v: String(s.days) } : null,
    s?.hours ? { k: "Часы", v: String(s.hours) } : null,
    s?.operators ? { k: "Операторы", v: s.operators } : null,
    typeof s?.drone === "boolean" ? { k: "Дрон", v: s.drone ? "да" : "нет" } : null,
    s?.gear?.length ? { k: "Техника", v: s.gear.join(" · ") } : null,
  ] as (LedgerRow | null)[]).filter((r): r is LedgerRow => r !== null);

  const post = ([
    c.post?.delivery ? { k: "Сдача", v: c.post.delivery } : null,
    c.post?.notes ? { k: "Пост", v: c.post.notes } : null,
  ] as (LedgerRow | null)[]).filter((r): r is LedgerRow => r !== null);

  const metrics = c.result?.metrics ?? [];
  const body = "max-w-[60ch] text-[18px] leading-[1.45] text-milk/90 lg:text-[20px]";

  const chapters: { title: string; content: React.ReactNode }[] = [];
  if (c.task) chapters.push({ title: "Задача", content: <p className={body}>{c.task}</p> });
  if (c.approach) chapters.push({ title: "В кадре", content: <p className={body}>{c.approach}</p> });
  if (c.result?.text || metrics.length > 0) {
    chapters.push({
      title: "Результат",
      content: (
        <>
          {metrics.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-6 lg:flex lg:flex-wrap lg:gap-x-12">
              {metrics.map((m) => (
                <div key={m.label} className="flex flex-col gap-2">
                  <span className="disp text-h2 leading-none">{m.value}</span>
                  <span className="mono text-meta">{m.label}</span>
                </div>
              ))}
            </div>
          )}
          {c.result?.text && <p className={body}>{c.result.text}</p>}
        </>
      ),
    });
  }
  const hasLedger = deliverables.length + shooting.length + post.length > 0;

  return (
    <div className="px-gutter py-12 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:py-20">
      {/* правая колонка на десктопе, первая на телефоне */}
      <div className="flex flex-col gap-12 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:gap-16">
        {chapters.map((ch, i) => (
          <Chapter key={ch.title} num={pad2(i + 1)} title={ch.title}>
            {ch.content}
          </Chapter>
        ))}
      </div>

      {/* левая sticky-колонка на десктопе, после глав на телефоне; без фактов не выводится */}
      {hasLedger && (
        <aside className="mt-14 flex flex-col gap-10 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:self-start lg:sticky lg:top-[80px] lg:pr-8">
          <Ledger title="Что получили" rows={deliverables} />
          <Ledger title="Съёмка" rows={shooting} />
          <Ledger title="Пост" rows={post} />
        </aside>
      )}
    </div>
  );
}
