import type { NextConfig } from "next";
import { buildCsp, PERMISSIONS_POLICY, REFERRER_POLICY } from "./src/lib/security";

/** NEXT_PUBLIC_NOINDEX=1 — превью/тестовый домен: сайт закрыт от индексации на трёх уровнях
 *  (robots.txt, <meta robots>, заголовок X-Robots-Tag). Значение фиксируется при сборке. */
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";
/** STATIC_EXPORT=1 — статический экспорт в out/ для обычного хостинга без Node (см. scripts/package-preview.sh --static) */
const STATIC = process.env.STATIC_EXPORT === "1";

const DEV = process.env.NODE_ENV === "development";
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: buildCsp({ dev: DEV }) },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: REFERRER_POLICY },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
  ...(DEV ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  /* по умолчанию самодостаточная сборка: .next/standalone + node server.js; для статики — out/ */
  output: STATIC ? "export" : "standalone",
  /* на статике /work/ → work/index.html, иначе Apache/nginx не найдут страницу */
  trailingSlash: STATIC,
  /* без оптимизации картинок: стиллы уже WebP нужного размера, а sharp — нативный модуль,
     который не переносится между macOS-сборкой и Linux-сервером */
  images: { unoptimized: true },
  /* при экспорте API-роут временно вынесен из дерева, а сгенерированные dev-типы на него ссылаются;
     исходники проверяются отдельно (pnpm typecheck) */
  typescript: { ignoreBuildErrors: STATIC },
  poweredByHeader: false,
  async headers() {
    /* output: "export" игнорирует headers(): на статике их отдаёт веб-сервер (static.htaccess / nginx, см. README) */
    if (STATIC) return [];
    const robots = NOINDEX
      ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" }]
      : [];
    return [{ source: "/:path*", headers: [...SECURITY_HEADERS, ...robots] }];
  },
};

export default nextConfig;
