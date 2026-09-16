import { pad2 } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Аккордеон на нативном <details>: без JS, клавиатура и Esc — от браузера. */
export function Faq({
  items,
  className,
}: {
  items: { q: string; a: string }[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("border-t border-rule", className)}>
      {items.map((it, i) => (
        <details key={it.q} className="group border-b border-rule">
          <summary className="flex min-h-14 cursor-pointer list-none items-baseline gap-4 py-4 [&::-webkit-details-marker]:hidden md:gap-8">
            <span className="mono w-7 shrink-0 text-signal md:w-10">{pad2(i + 1)}</span>
            <span className="flex-1 text-[17px] font-medium leading-snug md:text-[21px]">{it.q}</span>
            <span aria-hidden="true" className="mono shrink-0 text-meta transition-transform duration-300 ease-out-expo group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="max-w-[64ch] pb-6 pl-11 text-[16px] leading-relaxed text-meta md:pl-18 md:text-[17px]">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
