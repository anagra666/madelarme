"use client";

import { useAlmatyTime } from "@/lib/hooks";

/** «Алматы · 18:42 · сезон 2027 открыт» — часы живые, остальное из настроек. */
export default function StatusLine({ city, season, className }: { city: string; season: string; className?: string }) {
  const time = useAlmatyTime();
  return (
    <p className={className} aria-live="off">
      {city} · <span className="tabular-nums">{time || "--:--"}</span> · {season}
    </p>
  );
}
