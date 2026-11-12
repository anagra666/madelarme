import type { Metadata } from "next";
import { ReelsFeed } from "@/components/media/ReelsStory";
import { PageHead } from "@/components/pages/PageHead";
import Button from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getReels } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reels — вертикальное кино",
  description: "Reels 9:16 со свадеб, фестивалей и брендов — как в Instagram, но кино.",
  alternates: { canonical: "/reels" },
  /* пустая лента («reels появятся здесь») открывается только прямым заходом: ссылок и sitemap на неё нет — и в индекс не берём */
  /* в тестовой сборке (NEXT_PUBLIC_NOINDEX=1) не перебиваем более строгий robots из layout */
  ...(getReels().length === 0 && process.env.NEXT_PUBLIC_NOINDEX !== "1" && { robots: { index: false, follow: true } }),
};

/**
 * Лента reels — собственный скроллер (ReelsFeed), поэтому без лишних обёрток:
 * только распорка под фиксированную шапку (--header-h) и sr-only H1.
 * Пока reels нет — обычная страница с видимым заголовком и выходом на работы (как пустой /showreel).
 */
export default function ReelsPage() {
  const reels = getReels();
  if (reels.length === 0) {
    return (
      <Section>
        <PageHead title="Reels" sub="reels появятся здесь" className="pb-20 md:pb-32">
          <Button variant="outline" size="lg" href="/work" className="mt-8">
            Смотреть работы
          </Button>
        </PageHead>
      </Section>
    );
  }
  return (
    <>
      <h1 className="sr-only">Reels</h1>
      <div aria-hidden="true" className="h-(--header-h)" />
      <ReelsFeed reels={reels} />
    </>
  );
}
