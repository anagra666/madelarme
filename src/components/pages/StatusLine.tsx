"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAlmatyTime } from "@/lib/hooks";
import { settings } from "@/lib/settings";
import { prefill, waLink } from "@/lib/links";
import {
  activeBusy, availabilityEnabled, checkDateText, formatDay, nextFreeSaturdays, todayIn, type DateCheck,
} from "@/lib/availability";
import { cn } from "@/lib/utils";
import { WhatsAppGlyph } from "@/components/layout/StickyCTA";

/** «Алматы · 18:42 · сезон 2027 открыт» — часы живые, остальное из настроек. */
export default function StatusLine({ city, season, className }: { city: string; season: string; className?: string }) {
  const time = useAlmatyTime();
  return (
    <p className={className} aria-live="off">
      {city} · <span className="tabular-nums">{time || "--:--"}</span> · {season}
    </p>
  );
}

/* ── занятость (settings.availability) ─────────────────────────────────── */

/** Тумблер «показывать занятость» — статичный, одинаковый при сборке и в браузере. Выключен — ни разметки, ни отступов. */
export const AVAILABILITY_ON = availabilityEnabled(settings);

/* «сегодня» по Алматы: на сервере null — статика собирается редко, дни считаются только в браузере */
const noSubscribe = () => () => {};
const getToday = () => todayIn(new Date());
const getNoToday = () => null;

/**
 * Статус даты под полем «Когда»: «сб, 12 июля 2027 — свободна, бронируйте» / «… — занята».
 * Пусто, пока в поле нет одной конкретной даты, и всегда пусто, если список занятости устарел.
 * Live-регион стоит в DOM заранее (пустой — нулевой высоты, отступы из className гасятся), иначе скринридер не озвучит первый статус.
 * Рендерить только при AVAILABILITY_ON; id — для aria-describedby у поля.
 */
export function DateStatus({ id, value, className }: { id: string; value: string; className?: string }) {
  const [check, setCheck] = useState<DateCheck | null>(null);
  useEffect(() => {
    /* пауза, чтобы статус не мигал, пока дату допечатывают («12 июля 2…»); очистка поля — сразу */
    const t = window.setTimeout(() => setCheck(checkDateText(value, settings, todayIn(new Date()))), value.trim() ? 600 : 0);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <p id={id} aria-live="polite" className={cn("mono leading-relaxed empty:m-0 empty:p-0", className)}>
      {check && (
        <>
          <span className="text-milk">{formatDay(check.date, { weekday: true, year: true })}</span>
          {check.busy ? (
            <span className="text-meta"> — занята. Напишите, подскажу ближайшую свободную</span>
          ) : (
            <span className="text-signal"> — свободна, бронируйте</span>
          )}
        </>
      )}
    </p>
  );
}

/**
 * «Ближайшие свободные субботы» на /contact: 4 субботы после сегодняшнего дня (Алматы), которых нет в busy.
 * Каждая — ссылка в WhatsApp с датой в тексте. Считается в браузере: в HTML сборки — только каркас той же высоты,
 * чтобы не показать прошедшие субботы и не сдвинуть страницу. Список устарел (>30 дней) — блок пропадает.
 */
export function FreeSaturdays({ className }: { className?: string }) {
  const today = useSyncExternalStore(noSubscribe, getToday, getNoToday);
  if (!AVAILABILITY_ON || !settings.availability) return null;

  const busy = today ? activeBusy(settings, today) : [];
  if (busy === null) return null;
  const days = today ? nextFreeSaturdays(4, today, busy) : [];
  if (today && !days.length) return null;

  return (
    <div className={cn("border-t border-rule pt-6", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="mono text-meta">Ближайшие свободные субботы</h2>
        <p className="mono-sm text-meta">занятость на {formatDay(settings.availability.updated)}</p>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy={!today}>
        {today
          ? days.map((d) => (
              <li key={d}>
                <a
                  href={waLink(`${prefill("contact")}: суббота, ${formatDay(d, { year: true })}`)}
                  target="_blank"
                  rel="noopener"
                  className="mono flex h-14 items-center justify-between gap-3 border border-meta/60 px-4 text-milk transition-colors duration-300 ease-out-expo hover:border-signal hover:text-signal"
                >
                  <span>
                    <span className="sr-only">Суббота, </span>
                    {formatDay(d)}
                    <span className="sr-only"> — написать в WhatsApp</span>
                  </span>
                  <WhatsAppGlyph className="size-4" />
                </a>
              </li>
            ))
          : [0, 1, 2, 3].map((i) => (
              <li key={i} aria-hidden="true" className="h-14 border border-rule" />
            ))}
      </ul>
    </div>
  );
}
