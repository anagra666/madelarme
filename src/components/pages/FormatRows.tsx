import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Format } from "@/content/types";
import { formatPriceText, settings } from "@/lib/content";
import { nb } from "@/lib/typo";
import { cn, unbroken } from "@/lib/utils";

/** Названия длиннее 18 символов на телефоне не должны съедать строку — кегль ниже text-row. */
const LONG_NAME = 18;

/**
 * Индекс форматов группы: строка = дисплейное имя · моно «термин · хронометраж» · цена · стрелка. На телефоне цена — отдельной строкой.
 * Цена — formatPriceText по модели формата (тарифы по времени / за ролик / индивидуально), не своё число у каждой строки.
 */
export function FormatRows({ formats }: { formats: Format[] }) {
  const showPrices = settings.toggles.showPrices;
  return (
    /* на md+ все строки делят одни колонки (subgrid): термин и цена не «гуляют» от строки к строке;
       колонка цены фиксирована (13.5rem под «от 40 000 ₸ за ролик»), иначе группы на странице встают в разные сетки */
    <ul className="border-t border-rule md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13.5rem_auto] md:gap-x-8">
      {formats.map((f) => (
        <li key={f.slug} className="border-b border-rule md:col-span-4 md:grid md:grid-cols-subgrid">
          <Link
            href={`/formats/${f.slug}`}
            className="group grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-4 transition-colors duration-300 ease-out-expo hover:text-signal md:col-span-4 md:grid-cols-subgrid md:gap-x-8 md:py-5"
          >
            <span
              className={cn(
                "disp min-w-0 text-balance",
                f.name.length > LONG_NAME ? "text-[clamp(28px,8vw,84px)] md:text-row" : "text-row",
                showPrices && "col-span-2 md:col-span-1",
              )}
            >
              <span lang={f.lang}>{nb(f.name)}</span>
            </span>
            <span className="mono order-3 col-span-2 mt-2 min-w-0 text-meta md:order-none md:col-span-1 md:mt-0">
              {nb([f.term, f.duration && f.duration !== "—" ? unbroken(f.duration) : null].filter(Boolean).join(" · "))}
            </span>
            {showPrices && (
              <span className="mono-lg order-2 col-span-2 mt-3 text-milk group-hover:text-signal md:order-none md:col-span-1 md:mt-0 md:justify-self-end">
                {formatPriceText(f)}
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
