"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { MediaLoop } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { cn, titleWrap } from "@/lib/utils";

/** Плоская строка индекса — считается на сервере, чтобы не тащить JSON контента в клиент. */
export interface IndexRow {
  slug: string;
  num: string;
  title: string;
  client: string;
  formatName: string;
  year?: number;
  duration?: string;
  city?: string;
  loop: MediaLoop;
}

type View = "list" | "grid";

export default function WorkIndexDesktop({
  rows,
  eyebrow,
  counter,
  total,
  showAllLink,
}: {
  rows: IndexRow[];
  /** моно-подпись секции: [ 03 ] · ИЗБРАННЫЕ РАБОТЫ */
  eyebrow: string;
  counter: string;
  total: number;
  showAllLink: boolean;
}) {
  const [view, setView] = useState<View>("list");
  const [hovered, setHovered] = useState<string | null>(null);
  /* какие лупы уже запрашивались — монтируем слой только по первому hover (без предзагрузки) */
  const [visited, setVisited] = useState<string[]>([]);

  const hover = (slug: string) => {
    setHovered(slug);
    if (!visited.includes(slug)) setVisited((v) => [...v, slug]);
  };

  return (
    <div className="hidden lg:block">
      {view === "list" && <VideoLayer rows={rows.filter((r) => visited.includes(r.slug))} hovered={hovered} />}

      <div className="relative z-10">
        <header className="mono flex items-center justify-between text-meta">
          <div className="flex gap-6">
            <span>{eyebrow}</span>
            {counter && <span>[ {counter} ]</span>}
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Вид списка">
            <span>[ ВИД:</span>
            <ViewButton active={view === "list"} onClick={() => setView("list")}>СПИСОК</ViewButton>
            <span aria-hidden="true">|</span>
            <ViewButton active={view === "grid"} onClick={() => setView("grid")}>СЕТКА</ViewButton>
            <span>]</span>
          </div>
        </header>

        {view === "list" ? (
          <ul className="mt-8 border-b border-rule" onMouseLeave={() => setHovered(null)}>
            {rows.map((r) => (
              <li key={r.slug} className="border-t border-rule">
                <Link
                  href={`/work/${r.slug}`}
                  prefetch={false}
                  onMouseEnter={() => hover(r.slug)}
                  onFocus={() => hover(r.slug)}
                  onBlur={() => setHovered(null)}
                  className="group grid grid-cols-[72px_minmax(0,1fr)_fit-content(40%)_48px] items-center gap-6 py-4 transition-colors duration-300 hover:text-signal focus-visible:text-signal"
                >
                  <span className="mono text-meta transition-colors group-hover:text-signal group-focus-visible:text-signal">{r.num}</span>
                  {/* мета не шире 40% (дальше переносится): иначе «RED BULL KAZAKHSTAN · БРЕНД-ИВЕНТ… · 2026 · 01:53»
                      съедает колонку названия. Длинное название (≤ 7.7em) — до двух строк с balance: на 1024 колонке ≥ 380px
                      хватает на «ANNUAL RECAP» (4.7em × 53px), с 1280 оно встаёт в строку */}
                  <span className={cn("disp text-row", titleWrap(r.title))}>{r.title}</span>
                  <span className="mono text-right text-meta transition-colors group-hover:text-signal group-focus-visible:text-signal">
                    {metaLine(r)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mono text-right transition-transform duration-300 ease-out-expo group-hover:-rotate-45 group-focus-visible:-rotate-45"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 grid grid-cols-3 gap-x-4 gap-y-12">
            {rows.map((r) => <GridTile key={r.slug} row={r} />)}
          </ul>
        )}

        {showAllLink && (
          <Link
            href="/work"
            className="mono flex h-16 items-center justify-between border-b border-rule text-milk transition-colors hover:text-signal"
          >
            <span>ВСЕ РАБОТЫ ({total})</span>
            <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function metaLine(r: IndexRow): string {
  return [r.client, r.formatName, r.year, r.duration].filter(Boolean).join(" · ");
}

/** Плитка сетки: видео — сосед ссылки (не потомок), зона клика — ::after ссылки на всю плитку. */
function GridTile({ row: r }: { row: IndexRow }) {
  const [on, setOn] = useState(false);
  return (
    <li className="group relative" onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}>
      <div className="grayscale transition-[filter] duration-500 group-hover:grayscale-0 group-focus-within:grayscale-0">
        <CinemaVideo loop={r.loop} mode="manual" playing={on} orientation="h" className="aspect-video" sizes="33vw" />
      </div>
      <Link
        href={`/work/${r.slug}`}
        prefetch={false}
        onFocus={() => setOn(true)}
        onBlur={() => setOn(false)}
        className="block after:absolute after:inset-0 after:z-10 after:content-['']"
      >
        <span className="mono mt-3 block text-meta">{[r.client, r.formatName, r.city].filter(Boolean).join(" · ")}</span>
        {/* колонка сетки 309–439px (1024–1440), text-h3 43–60px: длинное название — две строки с balance */}
        <span
          className={cn(
            "disp text-h3 mt-1 block transition-colors duration-300 group-hover:text-signal group-focus-within:text-signal",
            titleWrap(r.title),
          )}
        >
          {r.title}
        </span>
      </Link>
    </li>
  );
}

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("h-11 px-1 transition-colors hover:text-signal", active ? "text-milk" : "text-meta")}
    >
      {children}
    </button>
  );
}

/**
 * Слой лупов за списком: один <CinemaVideo mode="manual"> на посещённый кейс, все absolute inset-0.
 * Слой растянут на всю секцию, включая её вертикальные отступы (иначе видео обрывается жёстким краем
 * под «ВСЕ РАБОТЫ»): отступы задаёт Section (и sectionClassName на /work), поэтому край меряем, а не хардкодим.
 * Смена — «склейка»: opacity 200ms + кадр засветки 40ms (не ярче 0.6, при reduced-motion — без него).
 * Сверху скрим (к правому краю плотнее — там мелкая мета). Ссылки списка содержат только текст — слой вне их.
 */
function VideoLayer({ rows, hovered }: { rows: IndexRow[]; hovered: string | null }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const sec = el?.closest("section");
    if (!el || !sec) return;
    const measure = () => {
      const host = el.offsetParent; // null, пока десктопный блок скрыт (<1024)
      if (!host) return;
      const s = sec.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      el.style.top = `${s.top - h.top}px`;
      el.style.bottom = `${h.bottom - s.bottom}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sec);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {rows.map((r) => {
        const on = hovered === r.slug;
        return (
          <div key={r.slug} className={cn("absolute inset-0 transition-opacity duration-200", on ? "opacity-100" : "opacity-0")}>
            <CinemaVideo loop={r.loop} mode="manual" playing={on} orientation="h" className="absolute inset-0" sizes="100vw" />
          </div>
        );
      })}
      <div className="absolute inset-0 bg-linear-to-r from-ink/40 to-ink/65" />
      {hovered && !reduce && (
        <motion.div
          key={hovered}
          className="absolute inset-0 bg-milk"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.04, ease: "linear" }}
        />
      )}
    </div>
  );
}
