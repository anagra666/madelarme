"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import type { MediaLoop } from "@/content/types";
import CinemaVideo from "@/components/media/CinemaVideo";
import { cn } from "@/lib/utils";

/** Плоская строка индекса — считается на сервере, чтобы не тащить JSON контента в клиент. */
export interface IndexRow {
  slug: string;
  num: string;
  title: string;
  client: string;
  formatName: string;
  year: number;
  duration?: string;
  city: string;
  loop: MediaLoop;
}

type View = "list" | "grid";

export default function WorkIndexDesktop({
  rows,
  title,
  counter,
  total,
  showAllLink,
}: {
  rows: IndexRow[];
  title: string;
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
            <span>[ {title} ]</span>
            <span>[ {counter} ]</span>
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
                  onMouseEnter={() => hover(r.slug)}
                  onFocus={() => hover(r.slug)}
                  onBlur={() => setHovered(null)}
                  className="group grid grid-cols-[72px_minmax(0,1fr)_auto_48px] items-center gap-6 py-4 transition-colors duration-300 hover:text-signal focus-visible:text-signal"
                >
                  <span className="mono text-meta transition-colors group-hover:text-signal group-focus-visible:text-signal">{r.num}</span>
                  <span className="disp text-row whitespace-nowrap">{r.title}</span>
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
            {rows.map((r) => (
              <li key={r.slug}>
                <Link href={`/work/${r.slug}`} className="group block">
                  <div className="grayscale transition-[filter] duration-500 group-hover:grayscale-0 group-focus-visible:grayscale-0">
                    <CinemaVideo loop={r.loop} mode="hover" orientation="h" className="aspect-video" sizes="33vw" />
                  </div>
                  <div className="mono mt-3 text-meta">
                    {r.client} · {r.formatName} · {r.city}
                  </div>
                  <div className="disp text-h3 mt-1 whitespace-nowrap transition-colors duration-300 group-hover:text-signal">{r.title}</div>
                </Link>
              </li>
            ))}
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
 * Смена — «склейка»: opacity 200ms + кадр белой засветки 40ms. Сверху скрим 40% для текста.
 */
function VideoLayer({ rows, hovered }: { rows: IndexRow[]; hovered: string | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {rows.map((r) => {
        const on = hovered === r.slug;
        return (
          <div key={r.slug} className={cn("absolute inset-0 transition-opacity duration-200", on ? "opacity-100" : "opacity-0")}>
            <CinemaVideo loop={r.loop} mode="manual" playing={on} orientation="h" className="absolute inset-0" sizes="100vw" />
          </div>
        );
      })}
      <div className="absolute inset-0 bg-ink/40" />
      {hovered && (
        <motion.div
          key={hovered}
          className="absolute inset-0 bg-milk"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.04, ease: "linear" }}
        />
      )}
    </div>
  );
}
