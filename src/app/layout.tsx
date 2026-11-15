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
import { formatGroups, getCases, getFormatChips, getFormats, getPricing, getReels, settings } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { buildCsp, REFERRER_POLICY } from "@/lib/security";

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
/* Вариативные файлы (ось wght): тексту на тёмном нужна промежуточная насыщенность 450 —
   светлое на чёрном со сглаживанием antialiased выглядит тоньше, чем тот же вес на бумаге. */
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
});
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
  /* без Arial-подмены с size-adjust ~135%: она на 26% шире Roboto Mono и сдвигает шапку при подмене шрифта;
     стек --font-mono в globals.css сам откатывается на ui-monospace/Menlo с той же шириной знака */
  adjustFontFallback: false,
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
  metadataBase: new URL(SITE_URL),
  title: { default: "MADELARME — видеограф в Алматы", template: "%s — MADELARME" },
  /* из settings, а не копией heroSub — правка подписи в hero сразу меняет и описание сайта */
  description: `${settings.brand.person}, ${settings.brand.role}. ${settings.heroSub}`,
  openGraph: { type: "website", locale: "ru_KZ", siteName: "MADELARME", images: OG_IMAGE ? [OG_IMAGE] : undefined },
  /* без twitter.images: X берёт og:image, а страницы кейсов/форматов подставляют свой постер */
  twitter: { card: "summary_large_image" },
  /* на статике заголовков нет: referrer-политика уходит <meta name="referrer"> (на Node её дублирует заголовок) */
  referrer: REFERRER_POLICY,
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
  return {
    counts: { works: getCases().length, formats: formats.length, collections: getPricing().collections.length },
    chips: getFormatChips(),
    /* футер получает три группы форматов со счётчиками, а не все форматы списком */
    groups: formatGroups.map((g) => ({ key: g.key, title: g.title })),
    reels: getReels(),
  };
}

/* На статике (Plesk/nginx игнорируют .htaccess) CSP дублируем <meta>: frame-ancestors из meta не работает, он только в заголовках */
const META_CSP = process.env.STATIC_EXPORT === "1" ? buildCsp({ meta: true }) : null;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { counts, chips, groups, reels } = layoutData();
  return (
    <html
      lang="ru"
      className={`${sofia.variable} ${oswald.variable} ${interTight.variable} ${robotoMono.variable} h-full antialiased`}
      style={dispVars}
    >
      {META_CSP && (
        <head>
          <meta httpEquiv="Content-Security-Policy" content={META_CSP} />
        </head>
      )}
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
        <Footer groups={groups} hasReels={reels.length > 0} />
        <StickyCTA />
        {/* оверлеи — по одному хосту на приложение */}
        <Player />
        <ReelsStoryHost reels={reels} />
      </body>
    </html>
  );
}
