import type {
  Case, Format, PriceCollection, Extra, FaqItem, Reel, Client, Testimonial, FormatGroup,
} from "@/content/types";
import casesJson from "@/content/cases.json";
import formatsJson from "@/content/formats.json";
import pricingJson from "@/content/pricing.json";
import faqJson from "@/content/faq.json";
import reelsJson from "@/content/reels.json";
import clientsJson from "@/content/clients.json";
import testimonialsJson from "@/content/testimonials.json";
import { settings } from "@/lib/settings";

export { settings };

const allCases = (casesJson as Case[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);
const allFormats = (formatsJson as Format[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);
const pricing = pricingJson as { collections: PriceCollection[]; extras: Extra[]; terms: string[] };
const allFaq = faqJson as FaqItem[];
const allReels = (reelsJson as Reel[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);
const allClients = clientsJson as Client[];
const allTestimonials = testimonialsJson as Testimonial[];

/** Видимость демо-контента управляется тумблером settings.toggles.showPlaceholders */
const visible = <T extends { isPlaceholder?: boolean }>(x: T) =>
  settings.toggles.showPlaceholders || !x.isPlaceholder;

export function getCases(opts: { format?: string; mood?: string; featured?: boolean } = {}): Case[] {
  return allCases.filter((c) => {
    if (!c.isPublished || !visible(c)) return false;
    if (opts.featured && !c.featured) return false;
    if (opts.format && c.format !== opts.format && !(c.extraFormats ?? []).includes(opts.format)) return false;
    if (opts.mood && !c.mood.includes(opts.mood as Case["mood"][number])) return false;
    return true;
  });
}

export function getCase(slug: string): Case | undefined {
  return allCases.find((c) => c.slug === slug && c.isPublished && visible(c));
}

/** Соседние кейсы для «следующий / предыдущий» */
export function getAdjacentCases(slug: string): { prev?: Case; next?: Case } {
  const list = getCases();
  const i = list.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length] };
}

export function getFormats(group?: FormatGroup): Format[] {
  return allFormats.filter((f) => f.isPublished && (!group || f.group === group));
}

export function getFormat(slug: string): Format | undefined {
  return allFormats.find((f) => f.slug === slug && f.isPublished);
}

/** Количество опубликованных работ по формату — для счётчиков «СВАДЬБА (12)» */
export function countByFormat(slug: string): number {
  return getCases({ format: slug }).length;
}

export const formatGroups: { key: FormatGroup; title: string; num: string }[] = [
  { key: "wedding", title: "Свадьбы и семья", num: "01" },
  { key: "brand", title: "Бренды и бизнес", num: "02" },
  { key: "content", title: "Контент и музыка", num: "03" },
];

export const moods: { key: Case["mood"][number]; label: string }[] = [
  { key: "bold", label: "Дерзкие" },
  { key: "gentle", label: "Нежные" },
  { key: "documentary", label: "Документальные" },
];

export function getPricing() {
  return {
    collections: pricing.collections.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    extras: pricing.extras,
    terms: pricing.terms,
  };
}

/**
 * Цена тарифа с учётом тумблеров: «по запросу» / «от 60 000 ₸» / «60 000 ₸» (showExactPrices).
 * За ролик (tab unit) — всегда «от»: Маша называет её «от 40к», точная зависит от ролика.
 * Единица (c.unit: «в час», «за ролик») выводится рядом отдельно и только при showPrices.
 */
export function collectionPrice(c: PriceCollection): string {
  if (!settings.toggles.showPrices) return "по запросу";
  return formatPrice(c.fromPrice, c.tab === "unit" || !settings.toggles.showExactPrices ? "от " : "");
}

/** Самый дешёвый тариф модели: time → «Час», unit → «Для соцсетей» */
function cheapest(tab: PriceCollection["tab"]): PriceCollection | undefined {
  return pricing.collections.filter((c) => c.tab === tab).sort((a, b) => a.fromPrice - b.fromPrice)[0];
}

/** Модель цены формата; undefined — аддон без своей цены и без явной модели (опция, а не тариф) */
function priceModelOf(f: Format): Format["priceModel"] {
  if (f.isAddon && !f.fromPrice && !f.priceModel) return undefined;
  return f.priceModel ?? "time";
}

/**
 * Цена формата «от», ₸ — для строки цены и Offer в JSON-LD. Своя f.fromPrice перекрывает общий тариф,
 * иначе — самый дешёвый тариф модели. custom («индивидуально») и аддон без цены — undefined.
 */
export function formatPriceFrom(f: Format): number | undefined {
  const model = priceModelOf(f);
  if (!model || model === "custom") return undefined;
  return f.fromPrice ?? cheapest(model)?.fromPrice;
}

/**
 * Цена формата одной строкой для списков и страниц форматов: time → «от 60 000 ₸ в час»,
 * unit → «от 40 000 ₸ за ролик», custom → «индивидуально». Аддон без цены — как раньше:
 * «входит в тариф», если интро начинается с «Входит…», иначе «индивидуально».
 * Тумблер showPrices проверяет вызывающий.
 */
export function formatPriceText(f: Format): string {
  const model = priceModelOf(f);
  if (!model) return /^входит/i.test(f.intro) ? "входит в тариф" : "индивидуально";
  const n = formatPriceFrom(f);
  if (n == null || model === "custom") return "индивидуально"; // custom — ещё и сужение типа для cheapest()
  /* своя цена у формата «по времени» — сумма за проект, а не ставка в час: единицу тарифа не приписываем */
  const unit = f.fromPrice && model === "time" ? undefined : cheapest(model)?.unit;
  return unit ? `${formatPrice(n)}\u00a0${unit.replace(/ /g, "\u00a0")}` : formatPrice(n);
}

export function getFaq(scope: FaqItem["scope"][number]): FaqItem[] {
  return allFaq.filter((f) => f.scope.includes(scope));
}

export function getReels(): Reel[] {
  return allReels.filter(visible);
}

export function getClients(): Client[] {
  return allClients.filter((c) => c.confirmed || settings.toggles.showPlaceholders);
}

export function getTestimonials(): Testimonial[] {
  if (!settings.toggles.showTestimonials) return [];
  return allTestimonials.filter((t) => t.confirmed || settings.toggles.showPlaceholders);
}

/** «250 000 ₸» — неразрывные пробелы между разрядами */
export function formatPrice(n: number, prefix = "от "): string {
  const s = n.toLocaleString("ru-RU").replace(/\s/g, " ");
  return `${prefix}${s} ₸`;
}
