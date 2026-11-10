import Link from "next/link";
import { cn } from "@/lib/utils";
import ActiveChipIntoView from "@/components/work/ActiveChipIntoView";

/**
 * Фильтры /work — состояние живёт в URL (?format=&mood=&city=), фильтрует клиент (WorkCatalog).
 * Ссылки, а не кнопки: работают без JS, шарятся, индексируются. scroll={false} — страница не прыгает.
 * Телефон: rail-чипы 40px (tap-цель 44px). Десктоп: две строки моно-ссылок «ВСЕ (24) · СВАДЬБА (12) · …».
 * Вид «список/сетка» переключает сам WorkIndex (клиент), в URL его нет.
 * Настроение с count 0 (при текущих формате и городе) не показываем — фильтр не ведёт в пустой список;
 * выбранное остаётся, чтобы его можно было снять. Счётчик у настроений не выводится.
 */

export interface FilterChip {
  key: string;
  label: string;
  count?: number;
}

export type FilterSelection = { format?: string; mood?: string; city?: string };

/** «SDE — ролик в день свадьбы» → «SDE», «Қыз ұзату · Үйлену той · Сырға салу» → «Қыз ұзату» */
export function shortLabel(name: string): string {
  return name.split(/\s+[—·]\s+/)[0].trim();
}

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
            ? "border-signal text-milk"
            : "border-rule text-meta group-hover:text-milk lg:border-transparent lg:group-hover:border-rule",
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
  const moodList = moods.filter((m) => m.count !== 0 || selected.mood === m.key);
  return (
    <nav aria-label="Фильтры работ" className="flex flex-col gap-2 lg:gap-3">
      <ActiveChipIntoView deps={filterHref(selected, {})} />
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

      {/* настроение · город */}
      {(moodList.length > 0 || selected.city) && (
        <div className={row("lg:[&>a:not(:last-child)]:after:content-['/']")}>
          {moodList.map((m) => (
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
      )}
    </nav>
  );
}
