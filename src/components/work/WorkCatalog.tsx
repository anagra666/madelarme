"use client";

import { useSearchParams } from "next/navigation";
import WorkCatalogView from "@/components/work/WorkCatalogView";

/**
 * Каталог работ: состояние фильтров живёт в URL (?format=&mood=&city=), фильтрует клиент.
 * Так страница остаётся статической (нужно для экспорта на обычный хостинг) и при этом
 * ссылки на отфильтрованные списки шарятся. Оборачивать в <Suspense fallback={<WorkCatalogView />}>
 * (useSearchParams): fallback — тот же каталог без фильтров, его HTML и попадает в пререндер.
 */
export default function WorkCatalog() {
  const sp = useSearchParams();
  return (
    <WorkCatalogView
      format={sp.get("format") ?? undefined}
      mood={sp.get("mood") ?? undefined}
      city={sp.get("city") ?? undefined}
    />
  );
}
