import type { Metadata, Viewport } from "next";
import { Sofia_Sans_Extra_Condensed, Inter_Tight, Roboto_Mono, Oswald } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCTA from "@/components/layout/StickyCTA";
import Player from "@/components/media/Player";
import { ReelsStoryHost } from "@/components/media/ReelsStory";
import { getReels } from "@/lib/content";

/* Дисплей: сверхузкий капс с кириллицей (RU/EN). Oswald стоит следующим в стеке — браузер берёт из него
   только казахские буквы (Ә Ғ Қ Ң Ө Ұ Ү Һ), которых нет в Sofia Sans; файл грузится лишь на таких страницах. */
const disp = Sofia_Sans_Extra_Condensed({
  variable: "--font-disp",
  weight: "800",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
});
const dispKz = Oswald({
  variable: "--font-disp-kz",
  weight: "600",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
});
const body = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
});
const mono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://madelarme.kz"),
  title: { default: "MADELARME — видеограф в Алматы", template: "%s — MADELARME" },
  description:
    "Мария Волкова, видеограф. Свадебное кино для тех, кто не любит свадебное видео. Бренды, фестивали, клипы — Алматы и куда позовёте.",
  openGraph: { type: "website", locale: "ru_KZ", siteName: "MADELARME" },
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${disp.variable} ${dispKz.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ink text-milk">
        <SmoothScroll />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <StickyCTA />
        {/* оверлеи — по одному хосту на приложение */}
        <Player />
        <ReelsStoryHost reels={getReels()} />
      </body>
    </html>
  );
}
