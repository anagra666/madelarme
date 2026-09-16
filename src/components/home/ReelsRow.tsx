import Link from "next/link";
import { getReels } from "@/lib/content";
import { Section, Container } from "@/components/ui/Section";
import { Reveal, Line } from "@/components/ui/Reveal";
import { ReelsTrack, ReelTile } from "./ReelsRow.client";

/**
 * «Вертикально.» (план §07-04). Одна лента на оба сценария:
 * телефон — rail со scroll-snap (72vw, гаттер 24px, автоплей у видимой);
 * десктоп — ряд 14vw-плиток, приглушённый постер → цвет + луп по hover, ряд едет влево при скролле.
 * Клик/тап — story-режим (ReelsStoryHost должен быть смонтирован на странице).
 */
export default function ReelsRow() {
  const reels = getReels().slice(0, 8);
  if (reels.length === 0) return null;

  return (
    <Section id="reels" aria-labelledby="reels-title" className="overflow-hidden pb-24 lg:pb-32">
      <Container className="pt-20 lg:pt-32">
        <div className="mono text-meta">[ REELS · 9:16 · 15–60 СЕК ]</div>
        <Reveal as="h2" className="disp text-h2 mt-4">
          <Line>
            <span id="reels-title">Вертикально.</span>
          </Line>
        </Reveal>
      </Container>

      <ReelsTrack className="mt-10 lg:mt-14">
        <ul className="rail lg:snap-none lg:gap-4 lg:overflow-visible lg:px-gutter">
          {reels.map((r, i) => (
            <li key={r.slug} className="w-[72vw] sm:w-[40vw] lg:w-[14vw]">
              <ReelTile reel={r} index={i} />
            </li>
          ))}
          <li className="w-[72vw] sm:w-[40vw] lg:w-[14vw]">
            <Link
              href="/reels"
              className="disp text-h3 flex aspect-[9/16] items-end border border-rule p-4 transition-colors hover:border-milk hover:text-signal active:text-signal"
            >
              ВСЕ REELS ↗
            </Link>
          </li>
        </ul>
      </ReelsTrack>
    </Section>
  );
}
