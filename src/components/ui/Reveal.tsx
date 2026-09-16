"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * «Выезд из-под маски»: дети (строки) появляются снизу вверх при входе во viewport.
 * Текст остаётся в DOM целым — оборачивайте каждую строку отдельным <span>/<div>.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  stagger = 0.06,
  once = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span" | "ul";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      className={cn("[&>*]:will-change-transform", className)}
      initial={reduce ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once, amount: 0.3 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </MotionTag>
  );
}

/** Одна строка внутри <Reveal>: маска + сдвиг. */
export function Line({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("block overflow-hidden", className)}>
      <motion.span
        className="block"
        variants={{ hidden: { y: "110%", rotate: 1.5 }, show: { y: 0, rotate: 0, transition: { duration: 0.8, ease: EASE } } }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Простое появление блока (fade + 16px) */
export function Fade({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
