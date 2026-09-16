import Link from "next/link";
import type { Case } from "@/content/types";
import { moods, settings } from "@/lib/content";
import { LedgerLine } from "@/components/work/Ledger";

/** «Титры» — две колонки моно с точками-лидерами, Мария всегда первой. Ниже теги-фильтры. */
export default function Credits({ c }: { c: Case }) {
  const person = settings.brand.person;
  const credits = c.credits
    .slice()
    .sort((a, b) => Number(b.name.includes(person)) - Number(a.name.includes(person)));
  const tags = [
    ...c.mood.map((m) => ({ label: moods.find((x) => x.key === m)?.label ?? m, href: `/work?mood=${m}` })),
    { label: c.city, href: `/work?city=${encodeURIComponent(c.city)}` },
  ];

  return (
    <section className="border-t border-rule px-gutter py-12 lg:py-20" aria-label="Титры">
      <h2 className="disp text-h2 mb-8">Титры</h2>
      <div className="border-t border-rule lg:grid lg:grid-cols-2 lg:gap-x-12">
        {credits.map((cr, i) => (
          <LedgerLine key={`${cr.role}-${i}`} k={cr.role} v={cr.name} href={cr.link} className="border-b border-rule" />
        ))}
      </div>

      <ul className="mt-8 flex flex-wrap gap-2" aria-label="Теги">
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
    </section>
  );
}
