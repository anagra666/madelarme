"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * «Выезд из-под маски»: дети (строки) появляются снизу вверх при входе во viewport.
 * Текст остаётся в DOM целым — оборачивайте каждую строку отдельным <span>/<div>.
 * Разметка первого рендера одинакова на сервере и клиенте: reduced motion и «без JS» показывают текст через CSS
 * (.reveal-line / .reveal-fade в globals.css), а не через ветвление по useReducedMotion.
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
  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      className={cn("[&>*]:will-change-transform", className)}
      initial="hidden"
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
    /* маска расширена вверх на 0.2em без сдвига строки: бреве «Й»/«Ё» выше строчного бокса (.disp lh .86) */
    <span className={cn("-mt-[0.2em] block overflow-hidden pt-[0.2em]", className)}>
      <motion.span
        className="reveal-line block"
        variants={{ hidden: { y: "110%", rotate: 1.5 }, show: { y: 0, rotate: 0, transition: { duration: 0.8, ease: EASE } } }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Простое появление блока (fade + 16px) */
export function Fade({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn("reveal-fade", className)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
