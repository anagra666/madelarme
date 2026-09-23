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
    <article className="relative flex min-w-0 flex-col border border-rule p-5 pt-9 md:p-7 md:pt-10">
      {c.badge && (
        <span className="mono-sm absolute right-0 top-0 bg-signal px-2 py-1 text-ink">{c.badge}</span>
      )}
      {/* бейдж висит в углу над заголовком (pt-9/10), поэтому справа место не резервируем;
          в трёх колонках кегль от ширины колонки, а не экрана, и две строки под заголовок — цены встают в линию */}
      <h3 className="disp text-h2 min-w-0 text-balance [overflow-wrap:break-word] lg:min-h-[2lh] lg:text-[clamp(40px,3.6vw,72px)]">{c.name}</h3>
      <p className="mt-4 font-mono text-[22px] uppercase tracking-[0.04em] tabular-nums">{collectionPrice(c)}</p>

      <dl className="mono mt-8 flex flex-col gap-3 text-milk">
        {c.lines.map((l) => (
          <div key={l.k} className="flex min-w-0 items-baseline gap-2">
            <dt className="shrink-0 text-meta">{l.k}</dt>
            <span aria-hidden="true" className="mb-[3px] min-w-4 flex-1 border-b border-dotted border-meta/60" />
            <dd className="min-w-0 max-w-[62%] text-right normal-case">{l.v}</dd>
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
