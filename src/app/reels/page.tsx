import type { Metadata } from "next";
import { ReelsFeed } from "@/components/media/ReelsStory";
import { getReels } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reels — вертикальное кино",
  description: "Reels 9:16 со свадеб, фестивалей и брендов — как в Instagram, но кино.",
  alternates: { canonical: "/reels" },
};

export default function ReelsPage() {
  const reels = getReels();
  return (
    <div className="bg-ink">
      <h1 className="sr-only">Reels</h1>
      {reels.length ? (
        <ReelsFeed reels={reels} />
      ) : (
        <p className="mono px-gutter py-24 text-center text-meta">reels появятся здесь</p>
      )}
    </div>
  );
}
