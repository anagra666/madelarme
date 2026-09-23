import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Format } from "@/content/types";
import { formatPrice, settings } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Названия длиннее 18 символов на телефоне не должны съедать строку — кегль ниже text-row. */
const LONG_NAME = 18;

/** Индекс форматов группы: строка = дисплейное имя · моно «термин · хронометраж» · цена · стрелка. На телефоне цена — отдельной строкой. */
export function FormatRows({ formats }: { formats: Format[] }) {
  const showPrices = settings.toggles.showPrices;
  return (
    <ul className="border-t border-rule">
      {formats.map((f) => (
        <li key={f.slug} className="border-b border-rule">
          <Link
            href={`/formats/${f.slug}`}
            className="group grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-4 transition-colors duration-300 ease-out-expo hover:text-signal md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:gap-x-8 md:py-5"
          >
            <span
              className={cn(
                "disp min-w-0 text-balance",
                f.name.length > LONG_NAME ? "text-[clamp(28px,8vw,84px)] md:text-row" : "text-row",
                showPrices && "col-span-2 md:col-span-1",
              )}
            >
              {f.name}
            </span>
            <span className="mono order-3 col-span-2 mt-2 min-w-0 text-meta md:order-none md:col-span-1 md:mt-0">
              {[f.term, f.duration].filter((x) => x && x !== "—").join(" · ")}
            </span>
            {showPrices && (
              <span className="mono order-2 col-span-2 mt-3 text-meta group-hover:text-signal md:order-none md:col-span-1 md:mt-0 md:justify-self-start">
                {f.fromPrice ? formatPrice(f.fromPrice) : "индивидуально"}
              </span>
            )}
            <ArrowUpRight
              aria-hidden="true"
              size={22}
              className={cn(
                "text-meta transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-signal",
                showPrices && "hidden md:block",
              )}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
