import type { PriceCollection } from "@/content/types";
import Button from "@/components/ui/Button";
import { formatPrice, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";

/** Цена коллекции с учётом тумблеров: «по запросу» / «от … ₸» / точная. */
export function collectionPrice(c: PriceCollection): string {
  if (!settings.toggles.showPrices) return "по запросу";
  return formatPrice(c.fromPrice, settings.toggles.showExactPrices ? "" : "от ");
}

/** «Прайс как титры»: название дисплеем, ledger с точками-лидерами, цена моно, бейдж сигналом. */
export function PriceCard({ c }: { c: PriceCollection }) {
  return (
    <article className="relative flex flex-col border border-rule p-5 md:p-7">
      {c.badge && (
        <span className="mono-sm absolute right-0 top-0 bg-signal px-2 py-1 text-ink">{c.badge}</span>
      )}
      <h3 className="disp text-h2 pr-24">{c.name}</h3>
      <p className="mt-4 font-mono text-[22px] uppercase tracking-[0.04em] tabular-nums">{collectionPrice(c)}</p>

      <dl className="mono mt-8 flex flex-col gap-3 text-milk">
        {c.lines.map((l) => (
          <div key={l.k} className="flex items-baseline gap-2">
            <dt className="shrink-0 text-meta">{l.k}</dt>
            <span aria-hidden="true" className="mb-[3px] min-w-4 flex-1 border-b border-dotted border-meta/60" />
            <dd className="text-right normal-case">{l.v}</dd>
          </div>
        ))}
      </dl>

      {c.note && <p className="mt-6 max-w-[40ch] text-[15px] leading-relaxed text-meta">{c.note}</p>}

      <div className="mt-auto pt-8">
        <Button variant="signal" size="lg" href={waLink(prefill("pricing", c.name))} className="w-full">
          Проверить дату →
        </Button>
      </div>
    </article>
  );
}
