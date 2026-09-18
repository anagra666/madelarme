import type { NextConfig } from "next";

/** NEXT_PUBLIC_NOINDEX=1 — превью/тестовый домен: сайт закрыт от индексации на трёх уровнях
 *  (robots.txt, <meta robots>, заголовок X-Robots-Tag). Значение фиксируется при сборке. */
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";
/** STATIC_EXPORT=1 — статический экспорт в out/ для обычного хостинга без Node (см. scripts/package-preview.sh --static) */
const STATIC = process.env.STATIC_EXPORT === "1";

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
    if (!NOINDEX) return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" }],
      },
    ];
  },
};

export default nextConfig;
