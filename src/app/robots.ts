import type { MetadataRoute } from "next";

const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://madelarme.kz";

/** Тестовый домен (NEXT_PUBLIC_NOINDEX=1): запрещаем всё. Прод: разрешаем всё, кроме API. */
export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
