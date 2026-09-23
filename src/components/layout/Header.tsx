"use client";

import { useCallback, useRef, useState, type FocusEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { settings } from "@/lib/settings";
import { waLink } from "@/lib/links";
import { cn } from "@/lib/utils";
import MenuOverlay, { type MenuCounts } from "@/components/layout/MenuOverlay";
import ContactPanel, { useContactPanel, type FormatChip } from "@/components/layout/ContactPanel";
import { useOverlayOpen, useScrollDirection, useStickyPrefill, WhatsAppGlyph } from "@/components/layout/StickyCTA";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Шапка 56px: прозрачная над hero, после 80px — bg-ink/80 + blur.
 * Прячется при скролле вниз, возвращается вверх; не прячется, пока открыт оверлей
 * или пока фокус клавиатуры внутри неё (иначе Tab попадал бы в невидимые ссылки).
 * На главной не прячется, пока вордмарк hero «летит» в шапку (первые 1.2 экрана).
 * Монтирует MenuOverlay и ContactPanel (они fixed, вне потока).
 * Счётчики и форматы приходят с сервера (layout.tsx), чтобы бандл не тянул JSON контента.
 */
export default function Header({ counts, formats }: { counts: MenuCounts; formats: FormatChip[] }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { dir, y } = useScrollDirection();
  const overlay = useOverlayOpen();
  const { open: openContact } = useContactPanel();
  const text = useStickyPrefill();

  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenu(false), []);
  /* смена маршрута (в т.ч. «назад» браузера) закрывает меню — паттерн «state during render» */
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) { setPrevPath(pathname); setMenu(false); }

  /* фокус внутри шапки → не прятать (ссылки уехавшей шапки оставались бы фокусируемыми) */
  const [focusWithin, setFocusWithin] = useState(false);
  const onFocusCapture = useCallback(() => setFocusWithin(true), []);
  const onBlurCapture = useCallback((e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
  }, []);

  const nav = [
    { href: "/work", label: `Работы (${counts.works})` },
    { href: "/formats", label: "Форматы" },
    { href: "/pricing", label: "Цены" },
    { href: "/about", label: "Маша" },
  ];

  const solid = y > 80;
  /* на главной вордмарк hero садится в шапку к ~1.2 экрана — до этого шапка остаётся на месте */
  const heroFlight = pathname === "/" && typeof window !== "undefined" && y < window.innerHeight * 1.2;
  const hidden = !overlay && !menu && !focusWithin && !heroFlight && dir === "down" && y > 120;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? "-100%" : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-(--header-h) items-center justify-between px-gutter",
          "transition-[background-color,backdrop-filter] duration-500",
          solid ? "bg-ink/80 backdrop-blur-md" : "bg-linear-to-b from-ink/60 to-transparent",
        )}
      >
        <Link href="/" prefetch={false} className="disp -ml-1 flex h-11 items-center px-1 text-[28px] leading-none text-milk hover:text-signal" aria-label={`${settings.brand.wordmark} — на главную`}>
          {settings.brand.monogram}
        </Link>

        {/* desktop */}
        <nav aria-label="Основная навигация" className="mono hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center transition-colors hover:text-signal",
                isActive(n.href) ? "text-signal" : "text-milk",
              )}
            >
              {n.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={openContact}
            className="flex h-11 items-center uppercase text-milk transition-colors hover:text-signal"
          >
            [ Написать ]
          </button>
        </nav>

        {/* mobile */}
        <div className="-mr-2 flex items-center gap-1 lg:hidden">
          <a
            href={waLink(text)}
            target="_blank"
            rel="noopener"
            aria-label="Написать в WhatsApp"
            className="flex size-11 items-center justify-center text-milk transition-colors hover:text-signal"
          >
            <WhatsAppGlyph className="size-6" />
          </a>
          <button
            ref={menuBtn}
            type="button"
            onClick={() => setMenu(true)}
            aria-haspopup="dialog"
            aria-expanded={menu}
            className="mono flex h-11 min-w-11 items-center justify-center px-2 text-milk transition-colors hover:text-signal"
          >
            Меню
          </button>
        </div>
      </motion.header>

      <MenuOverlay open={menu} onClose={closeMenu} triggerRef={menuBtn} counts={counts} />
      <ContactPanel formats={formats} />
    </>
  );
}
