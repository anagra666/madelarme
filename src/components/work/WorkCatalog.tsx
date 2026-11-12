import { getCatalogData } from "@/lib/catalog";
import WorkCatalogClient from "@/components/work/WorkCatalogClient";
import type { CatalogData } from "@/components/work/WorkCatalogBody";

/**
 * Каталог работ: состояние фильтров живёт в URL (?format=&mood=&city=), фильтрует клиент (WorkCatalogClient, useSearchParams).
 * Так страница остаётся статической (нужно для экспорта на обычный хостинг) и при этом
 * ссылки на отфильтрованные списки шарятся. Оборачивать в <Suspense fallback={<WorkCatalogView />}>:
 * fallback — тот же каталог без фильтров, его HTML и попадает в пререндер.
 * Это серверный компонент: данные (небольшой список строк) считаются здесь и уходят клиенту пропсом,
 * так что JSON контента в клиентский бандл /work не попадает.
 */
export default function WorkCatalog({ data = getCatalogData() }: { data?: CatalogData }) {
  return <WorkCatalogClient data={data} />;
}
