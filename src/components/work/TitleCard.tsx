import type { Case, Format } from "@/content/types";

/**
 * Титровая карточка — 5 ячеек: клиент · формат RU+EN · где/когда · съёмка · сдача.
 * На телефоне — ledger в две колонки, на десктопе — одна строка.
 */
function Cell({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 border-rule px-gutter py-5 lg:px-6 lg:py-6 ${className}`}>
      <div className="mono-sm text-meta">{label}</div>
      <div className="text-[15px] leading-snug lg:text-[16px]">{children}</div>
    </div>
  );
}

export default function TitleCard({ c, format }: { c: Case; format?: Format }) {
  const shoot = [
    c.shooting.days && `${c.shooting.days} ${plural(c.shooting.days, ["день", "дня", "дней"])}`,
    c.shooting.hours && `${c.shooting.hours} ч`,
    c.shooting.operators,
    c.shooting.drone && "дрон",
  ].filter(Boolean);
  const where = [c.city, ...(c.venues ?? []).slice(0, 2)].join(" · ");

  return (
    <div className="grid grid-cols-2 border-y border-rule lg:grid-cols-5">
      <Cell label="Клиент" className="border-r border-b lg:border-b-0">
        <span className="font-medium">{c.client}</span>
      </Cell>
      <Cell label="Формат" className="border-b lg:border-r lg:border-b-0">
        <span className="block">{format?.name ?? c.format}</span>
        {format?.term && <span className="mono-sm block text-signal">{format.term}</span>}
      </Cell>
      <Cell label="Где · когда" className="border-r border-b lg:border-b-0">
        <span className="block">{where}</span>
        <span className="block text-meta">{c.date}</span>
      </Cell>
      <Cell label="Съёмка" className="border-b lg:border-r lg:border-b-0">
        {shoot.join(" · ")}
      </Cell>
      <Cell label="Сдача" className="col-span-2 lg:col-span-1">
        {c.post.delivery}
      </Cell>
    </div>
  );
}

function plural(n: number, f: [string, string, string]) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return f[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return f[1];
  return f[2];
}
