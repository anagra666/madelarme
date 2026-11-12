import type { ReactNode } from "react";
import { Container } from "@/components/ui/Section";
import { nb } from "@/lib/typo";
import { cn } from "@/lib/utils";

/**
 * Заголовок внутренней страницы: H1 дисплеем + моно-подпись. Рендерится сервером (LCP без JS).
 * Учитывает фиксированную шапку (--header-h).
 */
export function PageHead({
  title,
  sub,
  eyebrow,
  className,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Container className={cn("pt-[calc(var(--header-h)+40px)] pb-10 md:pt-[calc(var(--header-h)+72px)] md:pb-16", className)}>
      {eyebrow && <div className="mono text-meta mb-6">{eyebrow}</div>}
      <h1 className="disp text-h1 max-w-[12ch] text-balance">{title}</h1>
      {sub && <p className="mono text-meta mt-5 md:mt-8 max-w-[48ch] text-balance">{typeof sub === "string" ? nb(sub) : sub}</p>}
      {children}
    </Container>
  );
}

/** Заголовок раздела внутри страницы: [ 02 ] · ЧТО ПОЛУЧАЕТЕ */
export function SectionTitle({ num, children, className }: { num?: string; children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("disp text-h3 flex items-baseline gap-4", className)}>
      {num && <span className="mono text-meta">[ {num} ] ·</span>}
      <span>{children}</span>
    </h2>
  );
}
