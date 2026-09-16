import type { Metadata } from "next";
import { ReelsFeed } from "@/components/media/ReelsStory";
import { getReels } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reels — вертикальное кино",
  description: "Reels 9:16 со свадеб, фестивалей и брендов — как в Instagram, но кино.",
  alternates: { canonical: "/reels" },
};

/**
 * Лента reels — собственный скроллер (ReelsFeed), поэтому без лишних обёрток:
 * только распорка под фиксированную шапку (--header-h) и sr-only H1.
 */
export default function ReelsPage() {
  const reels = getReels();
  return (
    <>
      <h1 className="sr-only">Reels</h1>
      <div aria-hidden="true" className="h-(--header-h)" />
      {reels.length ? (
        <ReelsFeed reels={reels} />
      ) : (
        <p className="mono px-gutter py-24 text-center text-meta">reels появятся здесь</p>
      )}
    </>
  );
}
