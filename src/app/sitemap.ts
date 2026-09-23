import type { MetadataRoute } from "next";
import { getCases, getFormats } from "@/lib/content";

/** sitemap.xml статичен в любом режиме (нужно для output: export) */
export const dynamic = "force-static";

const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://madelarme.kz").replace(/\/$/, "");
/* статический экспорт собирается с trailingSlash: true — адреса в sitemap должны совпадать с настоящими */
const SLASH = process.env.STATIC_EXPORT === "1";

const url = (path: string) => `${SITE}${path === "/" ? "/" : SLASH ? `${path}/` : path}`;

/** Тестовый домен (NEXT_PUBLIC_NOINDEX=1) — пустой sitemap. Прод: все публичные страницы и реальные (не демо) кейсы. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (NOINDEX) return [];
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/work", priority: 0.9 },
    { path: "/formats", priority: 0.8 },
    { path: "/pricing", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/showreel", priority: 0.6 },
    { path: "/reels", priority: 0.6 },
    { path: "/privacy", priority: 0.2 },
    ...getFormats().map((f) => ({ path: `/formats/${f.slug}`, priority: 0.7 })),
    ...getCases()
      .filter((c) => !c.isPlaceholder)
      .map((c) => ({ path: `/work/${c.slug}`, priority: 0.7 })),
  ];
  return pages.map((p) => ({ url: url(p.path), priority: p.priority }));
}
