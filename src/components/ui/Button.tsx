import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "signal" | "outline" | "ghost" | "paper";
type Size = "md" | "lg" | "xl";

const base =
  "mono inline-flex items-center justify-center gap-2 border transition-colors duration-300 ease-out-expo select-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  /* цвета берутся из токенов milk / on-milk, которые секция .paper переключает сама */
  signal: "border-signal bg-signal text-ink hover:bg-milk hover:border-milk hover:text-on-milk font-medium",
  outline: "border-milk/50 text-milk hover:border-milk hover:bg-milk hover:text-on-milk",
  ghost: "border-transparent text-milk hover:text-signal",
  paper: "border-milk bg-milk text-on-milk hover:bg-signal hover:border-signal hover:text-ink",
};
const sizes: Record<Size, string> = {
  md: "h-11 px-5",
  lg: "h-14 px-7",
  xl: "h-16 px-8 text-[13px]",
};

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

/** Кнопка/ссылка в моно-капсе. href → <a>/<Link>, иначе <button>. Tap-цель ≥44px. */
export default function Button({ variant = "outline", size = "md", href, external, className, children, ...rest }: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
      return (
        <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener" : undefined}>
          {children}
        </a>
      );
    }
    return <Link href={href} className={cls}>{children}</Link>;
  }
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
