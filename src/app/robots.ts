import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** robots.txt статичен в любом режиме (нужно для output: export) */
export const dynamic = "force-static";

const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";

/** Тестовый домен (NEXT_PUBLIC_NOINDEX=1): запрещаем всё. Прод: разрешаем всё, кроме API. */
export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
