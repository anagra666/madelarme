import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Фильтры /work — состояние живёт в URL (?format=&mood=&view=&city=), фильтрует сервер.
 * Ссылки, а не кнопки: работают без JS, шарятся, индексируются. scroll={false} — страница не прыгает.
 * Телефон: rail-чипы 40px (tap-цель 44px). Десктоп: две строки моно-ссылок «ВСЕ (24) · СВАДЬБА (12) · …».
 */

export interface FilterChip {
  key: string;
  label: string;
  count?: number;
}

export type FilterSelection = { format?: string; mood?: string; view: "list" | "grid"; city?: string };

export interface WorkFiltersProps {
  formats: FilterChip[];
  moods: FilterChip[];
  total: number;
  selected: FilterSelection;
}

export function filterHref(sel: FilterSelection, patch: Partial<FilterSelection>) {
  const p = new URLSearchParams();
  const next = { ...sel, ...patch };
  if (next.format) p.set("format", next.format);
  if (next.mood) p.set("mood", next.mood);
  if (next.city) p.set("city", next.city);
  if (next.view === "grid") p.set("view", "grid");
  const q = p.toString();
  return q ? `/work?${q}` : "/work";
}

function Chip({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className="group flex h-11 shrink-0 items-center"
    >
      <span
        className={cn(
          "mono flex h-10 items-center whitespace-nowrap border px-3 transition-colors duration-300",
          "lg:h-auto lg:border-x-0 lg:border-t-0 lg:px-0 lg:pb-1",
          active
            ? "border-milk text-milk lg:border-signal"
            : "border-rule text-milk opacity-30 group-hover:opacity-100 lg:border-transparent",
        )}
      >
        {children}
      </span>
    </Link>
  );
}

/* rail на телефоне; на десктопе — строка с точками между ссылками */
const row = (sep: string) =>
  cn(
    "rail -mx-gutter lg:mx-0 lg:flex-wrap lg:gap-x-0 lg:gap-y-2 lg:overflow-visible lg:px-0 lg:[scroll-snap-type:none]",
    "after:block after:w-3 after:shrink-0 lg:after:hidden",
    "lg:[&>a:not(:last-child)]:after:mx-5 lg:[&>a:not(:last-child)]:after:text-meta lg:[&>a:not(:last-child)]:after:opacity-60",
    sep,
  );

export default function WorkFilters({ formats, moods, total, selected }: WorkFiltersProps) {
  return (
    <nav aria-label="Фильтры работ" className="flex flex-col gap-2 lg:gap-3">
      {/* форматы */}
      <div className={row("lg:[&>a:not(:last-child)]:after:content-['·']")}>
        <Chip active={!selected.format} to={filterHref(selected, { format: undefined })}>
          Все ({total})
        </Chip>
        {formats.map((f) => (
          <Chip key={f.key} active={selected.format === f.key} to={filterHref(selected, { format: f.key })}>
            {f.label}
            {typeof f.count === "number" && ` (${f.count})`}
          </Chip>
        ))}
      </div>

      {/* настроение · город · вид */}
      <div className="flex items-center justify-between gap-4">
        <div className={row("lg:[&>a:not(:last-child)]:after:content-['/']")}>
          {moods.map((m) => (
            <Chip
              key={m.key}
              active={selected.mood === m.key}
              to={filterHref(selected, { mood: selected.mood === m.key ? undefined : m.key })}
            >
              {m.label}
            </Chip>
          ))}
          {selected.city && (
            <Chip active to={filterHref(selected, { city: undefined })}>
              {selected.city} ×
            </Chip>
          )}
        </div>

        <div className="mono hidden shrink-0 text-meta lg:flex lg:items-center lg:gap-2">
          <span>[</span>
          {(["list", "grid"] as const).map((v, i) => (
            <span key={v} className="flex items-center gap-2">
              {i > 0 && <span>|</span>}
              <Link
                href={filterHref(selected, { view: v })}
                scroll={false}
                aria-current={selected.view === v ? "true" : undefined}
                className={cn("py-1 transition-opacity hover:opacity-100", selected.view === v ? "text-milk" : "opacity-40")}
              >
                {v === "list" ? "список" : "сетка"}
              </Link>
            </span>
          ))}
          <span>]</span>
        </div>
      </div>
    </nav>
  );
}
