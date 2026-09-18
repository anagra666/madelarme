import type { NextConfig } from "next";

/** NEXT_PUBLIC_NOINDEX=1 — превью/тестовый домен: сайт закрыт от индексации на трёх уровнях
 *  (robots.txt, <meta robots>, заголовок X-Robots-Tag). Значение фиксируется при сборке. */
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";

const nextConfig: NextConfig = {
  /* самодостаточная сборка: .next/standalone + node server.js, без node_modules проекта на сервере */
  output: "standalone",
  /* без оптимизации картинок: стиллы уже WebP нужного размера, а sharp — нативный модуль,
     который не переносится между macOS-сборкой и Linux-сервером */
  images: { unoptimized: true },
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
