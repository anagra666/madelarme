import { nb } from "@/lib/typo";
import { cn, pad2 } from "@/lib/utils";

/** Нумерованный список шагов: моно-номер · дисплейный шаг · текст. */
export function ProcessList({
  steps,
  className,
}: {
  steps: { step: string; text?: string }[];
  className?: string;
}) {
  return (
    <ol className={cn("border-t border-rule", className)}>
      {steps.map((s, i) => (
        <li key={s.step} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-rule py-6 md:grid-cols-[4rem_1fr_1fr] md:gap-x-8 md:py-8">
          <span className="mono pt-2 text-meta">{pad2(i + 1)}</span>
          <h3 className="disp text-h3 text-balance">{nb(s.step)}</h3>
          {s.text && <p className="col-start-2 mt-3 max-w-[52ch] text-meta md:col-start-3 md:mt-2">{nb(s.text)}</p>}
        </li>
      ))}
    </ol>
  );
}
