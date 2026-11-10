import Link from "next/link";
import type { Case } from "@/content/types";
import { moods, settings } from "@/lib/content";
import { cn } from "@/lib/utils";
import { LedgerLine } from "@/components/work/Ledger";

/**
 * «Титры» — две колонки моно с точками-лидерами, Мария всегда первой. Ниже теги-фильтры.
 * Только подтверждённые роли: нет титров — нет ни заголовка «Титры», ни сетки, остаётся строка тегов
 * под моно-подписью; нет города — нет тега «# город».
 */
export default function Credits({ c }: { c: Case }) {
  const person = settings.brand.person;
  /* «— (плейсхолдер)» — незаполненная строка титров: не показываем */
  const credits = (c.credits ?? [])
    .filter((cr) => cr.role.trim() && cr.name.trim() && !cr.name.trim().startsWith("—"))
    .sort((a, b) => Number(b.name.includes(person)) - Number(a.name.includes(person)));
  const tags = [
    ...c.mood.map((m) => ({ label: moods.find((x) => x.key === m)?.label ?? m, href: `/work?mood=${m}` })),
    ...(c.city ? [{ label: c.city, href: `/work?city=${encodeURIComponent(c.city)}` }] : []),
  ];
  if (!credits.length && !tags.length) return null;

  return (
    <section className="border-t border-rule px-gutter py-12 lg:py-20" aria-label={credits.length > 0 ? "Титры" : "Теги"}>
      {credits.length > 0 ? (
        <h2 className="disp text-h2 mb-8">Титры</h2>
      ) : (
        <div className="mono text-meta mb-4">[ похожие работы ]</div>
      )}
      {credits.length > 0 && (
        <div className="border-t border-rule lg:grid lg:grid-cols-2 lg:gap-x-12">
          {credits.map((cr, i) => (
            <LedgerLine key={`${cr.role}-${i}`} k={cr.role} v={cr.name} href={cr.link} className="border-b border-rule" />
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <ul className={cn("flex flex-wrap gap-2", credits.length > 0 && "mt-8")} aria-label="Теги">
          {tags.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="mono flex h-11 items-center border border-rule px-3 text-milk transition-colors hover:border-signal hover:text-signal"
              >
                # {t.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
