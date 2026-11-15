import type { ReactNode } from "react";
import type { Case, Format } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Титровая карточка — до 5 ячеек: клиент · формат RU+EN · где/когда · съёмка · сдача.
 * Клиент и формат есть всегда; остальные ячейки выводятся, только если факты подтверждены (пустые не рисуем).
 * На телефоне — ledger в две колонки (нечётная последняя ячейка — во всю ширину), на десктопе — одна строка.
 */
function Cell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 border-rule px-gutter py-5 lg:px-6 lg:py-6 lg:first:pl-gutter lg:last:pr-gutter ${className}`}>
      <div className="mono-sm text-meta">{label}</div>
      <div className="text-[16px] leading-snug lg:text-[18px]">{children}</div>
    </div>
  );
}

/* литералы целиком — чтобы Tailwind их увидел */
const LG_COLS = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5"];

export default function TitleCard({ c, format }: { c: Case; format?: Format }) {
  const s = c.shooting;
  const shoot = [
    s?.days && `${s.days} ${plural(s.days, ["день", "дня", "дней"])}`,
    s?.hours && `${s.hours} ч`,
    s?.operators,
    s?.drone && "дрон",
  ]
    .filter(Boolean)
    .join(" · ");
  const where = [c.city, ...(c.venues ?? []).slice(0, 2)].filter(Boolean).join(" · ");
  const when = c.date || (c.year ? String(c.year) : "");
  const delivery = c.post?.delivery;

  const cells: { label: string; body: ReactNode }[] = [
    { label: "Клиент", body: <span className="font-medium">{c.client}</span> },
    {
      label: "Формат",
      body: (
        <>
          <span className="block">{format?.name ?? c.format}</span>
          {format?.term && <span className="mono-sm block text-meta">{format.term}</span>}
        </>
      ),
    },
  ];
  if (where || when) {
    cells.push({
      label: where && when ? "Где · когда" : where ? "Где" : "Когда",
      body: (
        <>
          {where && <span className="block">{where}</span>}
          {when && <span className={cn("block", where && "text-meta")}>{when}</span>}
        </>
      ),
    });
  }
  if (shoot) cells.push({ label: "Съёмка", body: shoot });
  if (delivery) cells.push({ label: "Сдача", body: delivery });

  const n = cells.length;
  const lastRow = Math.floor((n - 1) / 2);

  return (
    <div className={cn("grid grid-cols-2 border-y border-rule", LG_COLS[n])}>
      {cells.map((cell, i) => {
        /* телефон: две колонки, нечётная последняя ячейка во всю ширину; десктоп: одна строка */
        const wide = n % 2 === 1 && i === n - 1;
        return (
          <Cell
            key={cell.label}
            label={cell.label}
            className={cn(
              i % 2 === 0 && !wide ? "border-r" : i < n - 1 && "lg:border-r",
              Math.floor(i / 2) < lastRow && "border-b lg:border-b-0",
              wide && "col-span-2 lg:col-span-1",
            )}
          >
            {cell.body}
          </Cell>
        );
      })}
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
