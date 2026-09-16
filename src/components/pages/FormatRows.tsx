import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Format } from "@/content/types";
import { formatPrice, settings } from "@/lib/content";

/** Индекс форматов группы: строка = дисплейное имя · моно «термин · хронометраж» · цена · стрелка. */
export function FormatRows({ formats }: { formats: Format[] }) {
  const showPrices = settings.toggles.showPrices;
  return (
    <ul className="border-t border-rule">
      {formats.map((f) => (
        <li key={f.slug} className="border-b border-rule">
          <Link
            href={`/formats/${f.slug}`}
            className="group grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 py-4 transition-colors duration-300 ease-out-expo hover:text-signal md:grid-cols-[1fr_minmax(0,1fr)_auto_auto] md:gap-x-8 md:py-5"
          >
            <span className="disp text-row min-w-0 text-balance">{f.name}</span>
            <span className="mono order-3 col-span-2 mt-2 text-meta md:order-none md:col-span-1 md:mt-0">
              {f.term} · {f.duration}
            </span>
            {showPrices && (
              <span className="mono justify-self-end text-meta group-hover:text-signal md:justify-self-start">
                {f.fromPrice ? formatPrice(f.fromPrice) : "индивидуально"}
              </span>
            )}
            <ArrowUpRight
              aria-hidden="true"
              size={22}
              className={showPrices ? "hidden text-meta transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-signal md:block" : "text-meta transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-signal"}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
