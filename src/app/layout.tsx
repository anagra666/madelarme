import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Sofia_Sans_Extra_Condensed, Inter_Tight, Roboto_Mono, Oswald } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCTA from "@/components/layout/StickyCTA";
import Player from "@/components/media/Player";
import { ReelsStoryHost } from "@/components/media/ReelsStory";
import { getCases, getFormats, getPricing, getReels, settings } from "@/lib/content";

/* Имена переменных next/font НЕ совпадают с токенами @theme (--font-disp/body/mono) — иначе значение
   next/font перекрывает стек из globals.css и запасные шрифты (в т.ч. Oswald для казахских букв) теряются.
   Стеки собираются в globals.css → @theme. */

/* Дисплей: сверхузкий капс с кириллицей (RU/EN). */
const sofia = Sofia_Sans_Extra_Condensed({
  variable: "--font-sofia",
  weight: "800",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
});
/* Oswald стоит в стеке сразу после Sofia Sans — браузер берёт из него только казахские буквы
   (Ә Ғ Қ Ң Ө Ұ Ү Һ), которых нет в Sofia Sans; файл (cyrillic-ext) грузится лишь на таких страницах.
   700 — ближе всего к насыщенности Sofia 800. */
const oswald = Oswald({
  variable: "--font-oswald",
  weight: "700",
  subsets: ["cyrillic-ext"],
  display: "swap",
  preload: false,
});
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  weight: ["400", "500"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
});
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
  preload: false,
});

/**
 * Стек дисплея: Sofia Sans → Oswald → метрический fallback Sofia (Arial с size-adjust).
 * var(--font-sofia) = «Sofia Sans, Sofia Sans Fallback»: локальный Arial в нём покрывает казахские буквы
 * и перехватил бы их раньше Oswald, поэтому семейство и его fallback разводим по отдельным переменным
 * (из официального .style.fontFamily next/font — без хардкода имён). Стек собирается в globals.css.
 */
function splitFamily(stack: string): [string, string] {
  const [face, ...fallback] = stack.split(",").map((s) => s.trim());
  return [face, fallback.join(", ")];
}
const [sofiaFace, sofiaFallback] = splitFamily(sofia.style.fontFamily);
const [oswaldFace] = splitFamily(oswald.style.fontFamily);
const dispVars = {
  "--font-sofia-face": sofiaFace,
  "--font-sofia-fallback": sofiaFallback || '"Arial Narrow"',
  "--font-oswald-face": oswaldFace,
} as CSSProperties;

/* превью ссылки по умолчанию — постер шоурила из settings (тот же файл, что проверяет media:check), 1280×720 */
const reelPoster = settings.showreel?.loop.posterH;
const OG_IMAGE = reelPoster && { url: reelPoster, width: 1280, height: 720, alt: "MADELARME — шоурил" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://madelarme.kz"),
  title: { default: "MADELARME — видеограф в Алматы", template: "%s — MADELARME" },
  /* из settings, а не копией heroSub — правка подписи в hero сразу меняет и описание сайта */
  description: `${settings.brand.person}, ${settings.brand.role}. ${settings.heroSub}`,
  openGraph: { type: "website", locale: "ru_KZ", siteName: "MADELARME", images: OG_IMAGE ? [OG_IMAGE] : undefined },
  /* без twitter.images: X берёт og:image, а страницы кейсов/форматов подставляют свой постер */
  twitter: { card: "summary_large_image" },
  robots:
    process.env.NEXT_PUBLIC_NOINDEX === "1"
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }
      : { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0e0d0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Счётчики и список форматов считаются здесь, на сервере, и уходят пропсами в шапку/меню/панель/футер —
 * клиентские бандлы не тянут JSON кейсов и форматов (@/lib/content).
 */
function layoutData() {
  const formats = getFormats().filter((f) => !f.isAddon);
  /* у одинаковых имён (два «Клип») добавляем первый термин: «Клип · highlight film» / «Клип · music video».
     В /api/lead уходит именно label. */
  const dup = new Set(formats.map((f) => f.name).filter((n, i, a) => a.indexOf(n) !== i));
  return {
    counts: { works: getCases().length, formats: formats.length, collections: getPricing().collections.length },
    chips: formats.map((f) => ({
      slug: f.slug,
      label: dup.has(f.name) ? `${f.name} · ${f.term.split("/")[0].trim()}` : f.name,
    })),
    footerFormats: formats.map((f) => ({ slug: f.slug, name: f.name })),
    reels: getReels(),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { counts, chips, footerFormats, reels } = layoutData();
  return (
    <html
      lang="ru"
      className={`${sofia.variable} ${oswald.variable} ${interTight.variable} ${robotoMono.variable} h-full antialiased`}
      style={dispVars}
    >
      <body className="min-h-full flex flex-col bg-ink text-milk">
        <a
          href="#main"
          className="mono sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-70 focus:flex focus:h-11 focus:items-center focus:border focus:border-signal focus:bg-ink focus:px-4 focus:text-milk"
        >
          К содержимому
        </a>
        <SmoothScroll />
        <Header counts={counts} formats={chips} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
        {/* пустая лента reels — без ссылки на /reels в футере (страница остаётся для прямых заходов) */}
        <Footer formats={footerFormats} hasReels={reels.length > 0} />
        <StickyCTA />
        {/* оверлеи — по одному хосту на приложение */}
        <Player />
        <ReelsStoryHost reels={reels} />
      </body>
    </html>
  );
}
