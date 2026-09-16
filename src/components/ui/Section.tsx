import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Секция страницы. paper — перевёртыш на бумаге (цвета переключаются токенами). */
export function Section({ paper, className, children, ...rest }: { paper?: boolean; className?: string; children: ReactNode } & ComponentProps<"section">) {
  return (
    <section className={cn(paper ? "paper cropmarks" : "grain", "relative", className)} {...rest}>
      <div className="relative z-2">{children}</div>
    </section>
  );
}

/** Моно-подпись раздела: [ 03 ] · ИЗБРАННЫЕ РАБОТЫ */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mono text-meta", className)}>{children}</div>;
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-gutter", className)}>{children}</div>;
}
