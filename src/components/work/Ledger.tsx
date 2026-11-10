import { cn } from "@/lib/utils";

/**
 * Моно-ledger с точками-лидерами: название слева, значение справа, между ними пунктир.
 * Используется в «Что получили», «Съёмка», «Пост», «Титры».
 * Без значения пунктир не рисуем (строка не «висит» в пустоту); строки без названия и пустой ledger не выводятся.
 */
export interface LedgerRow {
  k: string;
  v?: string;
  note?: string;
  href?: string;
}

export function LedgerLine({ k, v, note, href, className }: LedgerRow & { className?: string }) {
  return (
    <div className={cn("py-2", className)}>
      <div className="mono flex items-baseline gap-2">
        <span className="shrink-0 text-milk">{k}</span>
        {v && <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-rule" aria-hidden="true" />}
        {v && (
          href ? (
            <a href={href} target="_blank" rel="noopener" className="max-w-[70%] text-right text-milk hover:text-signal">
              {v}
            </a>
          ) : (
            <span className="max-w-[70%] text-right text-milk">{v}</span>
          )
        )}
      </div>
      {note && <div className="mono-sm mt-1 text-meta">{note}</div>}
    </div>
  );
}

export default function Ledger({ title, rows, className }: { title?: string; rows: LedgerRow[]; className?: string }) {
  const list = rows.filter((r) => r.k.trim());
  if (!list.length) return null;
  return (
    <div className={className}>
      {title && <h3 className="disp text-h3 mb-4">{title}</h3>}
      <div className="border-t border-rule">
        {list.map((r, i) => (
          <LedgerLine key={`${r.k}-${i}`} {...r} className="border-b border-rule" />
        ))}
      </div>
    </div>
  );
}
