import type { PriceCollection } from "@/content/types";
import Button from "@/components/ui/Button";
import { collectionPrice, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";

/** «Прайс как титры»: название дисплеем, ledger с точками-лидерами, цена моно, бейдж сигналом. */
export function PriceCard({ c, id }: { c: PriceCollection; id?: string }) {
  return (
    <article id={id} className="relative flex min-w-0 scroll-mt-[calc(var(--header-h)+16px)] flex-col border border-rule p-5 pt-9 md:p-7 md:pt-10">
      {c.badge && (
        <span className="mono-sm absolute right-0 top-0 bg-signal px-2 py-1 text-ink">{c.badge}</span>
      )}
      {/* бейдж висит в углу над заголовком (pt-9/10), поэтому справа место не резервируем;
          в колонках кегль от ширины колонки, а не экрана, и две строки под заголовок («Для соцсетей» переносится) — цены встают в линию */}
      <h3 className="disp text-h2 min-w-0 text-balance [overflow-wrap:break-word] md:min-h-[2lh] lg:text-[clamp(40px,3.6vw,72px)]">{c.name}</h3>
      <p className="mt-4 font-mono text-[22px] uppercase tracking-[0.04em] tabular-nums">
        {collectionPrice(c)}
        {/* единица («в час», «за ролик») — мельче и приглушённо, чтобы цифра читалась первой */}
        {settings.toggles.showPrices && c.unit && <span className="mono ml-2 inline-block text-meta">{c.unit}</span>}
      </p>

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
        {/* ролики для соцсетей — не про дату, а про объём: «Обсудить» */}
        <Button variant="signal" size="lg" href={waLink(prefill("pricing", c.name))} className="w-full">
          {c.tab === "unit" ? "Обсудить ролики →" : "Проверить дату →"}
        </Button>
      </div>
    </article>
  );
}
