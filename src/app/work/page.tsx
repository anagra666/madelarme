import type { Metadata } from "next";
import { Suspense } from "react";
import WorkCatalog from "@/components/work/WorkCatalog";
import WorkCatalogView from "@/components/work/WorkCatalogView";

export const metadata: Metadata = {
  title: "Работы",
  description: "Все работы Марии Волковой: свадебные фильмы, клипы, aftermovie, бренд-видео. Фильтр по формату и настроению.",
  alternates: { canonical: "/work" },
};

/**
 * Статическая страница; фильтры читает клиент из URL (см. WorkCatalog).
 * Fallback — полный каталог без фильтров, отрендеренный сервером: в пререндере есть H1 и ссылки на все кейсы.
 */
export default function WorkPage() {
  return (
    <Suspense fallback={<WorkCatalogView />}>
      <WorkCatalog />
    </Suspense>
  );
}
