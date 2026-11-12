import Link from "next/link";
import type { ReactNode } from "react";
import { settings } from "@/lib/settings";
import { igLink, telLink, tgLink, waLink } from "@/lib/links";
import { AlmatyClock, StickySpacer } from "@/components/layout/StickyCTA";

/** Reels и Шоурил — только когда им есть что показать: пустая лента / нет шоурила → ссылки нет */
function nav(hasReels: boolean) {
  return [
    { href: "/work", label: "Работы" },
    { href: "/formats", label: "Форматы" },
    { href: "/pricing", label: "Цены" },
    { href: "/about", label: "Маша" },
    { href: "/contact", label: "Контакты" },
    hasReels && { href: "/reels", label: "Reels" },
    settings.showreel && { href: "/showreel", label: "Шоурил" },
  ].filter((n) => !!n);
}

const link = "mono inline-flex min-h-11 min-w-11 items-center py-1 text-milk transition-colors hover:text-signal";
const linkMeta = link.replace("text-milk", "text-meta");

function Col({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-rule pt-4">
      <h2 className="mono text-meta">[ {title} ]</h2>
      {children}
    </div>
  );
}

/**
 * Футер: 4 моно-колонки (2×2 на телефоне), контурный вордмарк во всю ширину,
 * нижняя строка с ©. На телефоне зазор под sticky-полосу (StickySpacer) есть только там, где полоса бывает.
 * Три группы форматов (с числом работ) и наличие reels приходят из layout.tsx.
 */
export default function Footer({ groups, hasReels }: { groups: { key: string; title: string }[]; hasReels: boolean }) {
  const c = settings.contacts;
  const year = new Date().getFullYear();

  return (
    <footer className="grain relative overflow-hidden border-t border-rule bg-ink text-milk pb-[env(safe-area-inset-bottom)] lg:pb-0">
      <div className="relative z-2 max-w-full px-gutter pt-12 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          <Col title="навигация">
            <ul className="flex flex-col">
              {nav(hasReels).map((n) => (
                <li key={n.href}><Link href={n.href} className={link}>{n.label}</Link></li>
              ))}
            </ul>
          </Col>

          <Col title="форматы">
            <ul className="flex flex-col">
              {groups.map((g) => (
                <li key={g.key}><Link href={`/formats#${g.key}`} prefetch={false} className={link}>{g.title}</Link></li>
              ))}
              <li><Link href="/formats" prefetch={false} className={linkMeta}>все форматы →</Link></li>
            </ul>
          </Col>

          <Col title="контакты">
            <ul className="flex flex-col">
              <li><a href={waLink()} target="_blank" rel="noopener" className={link}>WhatsApp</a></li>
              <li><a href={tgLink()} target="_blank" rel="noopener" className={link}>Telegram</a></li>
              <li><a href={igLink()} target="_blank" rel="noopener" className={link}>Instagram</a></li>
              {c.youtube && <li><a href={c.youtube} target="_blank" rel="noopener" className={link}>YouTube</a></li>}
              <li><a href={`mailto:${c.email}`} className={`${link} normal-case tracking-normal`}>{c.email}</a></li>
              <li><a href={telLink()} className={link}>{c.phoneDisplay}</a></li>
            </ul>
          </Col>

          <Col title="где я">
            <p className="mono dots text-meta leading-6">
              <span>{settings.brand.city}</span>
              <span><AlmatyClock className="text-milk" /></span>
              <span>выезжаю в другие города</span>
            </p>
            <p className="mono mt-2 text-meta">{settings.season}</p>
          </Col>
        </div>

        {/* контурный вордмарк — ровно во всю ширину: размер от ширины контейнера (cqw), а не окна,
            ширина слова ≈ 3.9 кегля → 25.4cqw помещается без обрезки на любом экране */}
        <Link
          href="/"
          prefetch={false}
          aria-label={`${settings.brand.wordmark} — на главную`}
          className="@container group mt-14 block max-w-full overflow-hidden lg:mt-20"
        >
          <span
            aria-hidden="true"
            className="disp block whitespace-nowrap leading-[0.8] text-ink text-[25.4cqw] [-webkit-text-stroke:2px_var(--color-milk)] [paint-order:stroke_fill] transition-colors duration-500 group-hover:text-signal group-hover:[-webkit-text-stroke-color:var(--color-signal)] group-focus-visible:text-signal"
          >
            {settings.brand.wordmark}
          </span>
        </Link>

        <div className="mono flex flex-col gap-3 border-t border-rule py-5 text-meta lg:flex-row lg:items-center lg:justify-between">
          <p className="dots gap-y-1">
            <span>© {year} {settings.brand.person}</span>
            {settings.legal.entity && <span>{settings.legal.entity}</span>}
            <span className="inline-flex items-center">
              <Link href="/privacy" className="inline-flex min-h-11 items-center text-milk transition-colors hover:text-signal lg:pointer-fine:min-h-0">политика конфиденциальности</Link>
            </span>
          </p>
        </div>
      </div>
      <StickySpacer />
    </footer>
  );
}
