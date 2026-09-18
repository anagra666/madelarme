import type { Metadata } from "next";
import { Suspense } from "react";
import WorkCatalog from "@/components/work/WorkCatalog";

export const metadata: Metadata = {
  title: "Работы",
  description: "Все работы Марии Волковой: свадебные фильмы, клипы, aftermovie, бренд-видео. Фильтр по формату и настроению.",
};

/** Статическая страница; фильтры читает клиент из URL (см. WorkCatalog). */
export default function WorkPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy="true" />}>
      <WorkCatalog />
    </Suspense>
  );
}
