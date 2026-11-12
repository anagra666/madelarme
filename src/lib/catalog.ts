import { getCases, getFormat, getFormats } from "@/lib/content";
import { realFilm } from "@/components/work/film";
import type { CatalogData } from "@/components/work/WorkCatalogBody";

/**
 * Данные каталога /work для клиента: плоские строки вместо всего JSON контента (кейсы, форматы, цены, FAQ).
 * Считается только на сервере; клиентский фильтр работает по этому массиву и контент не импортирует.
 */
export function getCatalogData(): CatalogData {
  const items = getCases().map((c) => ({
    slug: c.slug,
    title: c.title,
    client: c.client,
    formatName: getFormat(c.format)?.name ?? c.format,
    year: c.year,
    duration: realFilm(c.fullVideo)?.duration,
    city: c.city,
    loop: c.loop,
    format: c.format,
    extraFormats: c.extraFormats ?? [],
    mood: c.mood,
  }));
  return {
    total: items.length,
    formats: getFormats().map((f) => ({ slug: f.slug, name: f.name, lang: f.lang, isAddon: f.isAddon })),
    items,
  };
}
