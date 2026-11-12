import { getCatalogData } from "@/lib/catalog";
import type { FilterSelection } from "@/components/work/WorkFilters";
import WorkCatalogBody, { type CatalogData } from "@/components/work/WorkCatalogBody";

/**
 * Серверная обёртка каталога: данные берёт из контента сама (или принимает готовые) и рисует WorkCatalogBody.
 * Используется как fallback в <Suspense> на /work — в статическом HTML есть H1 и ссылки на все кейсы.
 * Клиент контент не импортирует: фильтры из URL применяет WorkCatalogClient к данным, пришедшим пропсом.
 */
export default function WorkCatalogView({ data = getCatalogData(), ...selection }: { data?: CatalogData } & FilterSelection) {
  return <WorkCatalogBody data={data} {...selection} />;
}
