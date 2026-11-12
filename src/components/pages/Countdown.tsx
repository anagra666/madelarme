"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Обратный отсчёт киноракорда 8 → 3, шаг 1 с. При reduced motion — сразу конечное значение. */
export default function Countdown({ from = 8, to = 3, className }: { from?: number; to?: number; className?: string }) {
  const reduce = usePrefersReducedMotion();
  const [n, setN] = useState(from);

  useEffect(() => {
    if (reduce || n <= to) return;
    const id = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [n, to, reduce]);

  return (
    <span className={className} aria-hidden="true">
      {reduce ? to : n}
    </span>
  );
}
