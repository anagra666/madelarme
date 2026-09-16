import type { Metadata } from "next";
import Link from "next/link";
import { Section, Container } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { PageHead } from "@/components/pages/PageHead";
import ShowreelBlock from "@/components/pages/ShowreelBlock";
import { getCases, settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";
import { parseDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Шоурил 2026",
  description: "Минута кино: свадьбы, той, фестивали и бренды — Алматы и куда позовёте.",
  alternates: { canonical: "/showreel" },
};

/** «00:00», «00:14» — таймкоды: равные доли хронометража рила между избранными кейсами. */
function timecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ShowreelPage() {
  const reel = settings.showreel;
  const featured = getCases({ featured: true });
  const total = reel ? parseDuration(reel.duration) : 0;
  const step = featured.length ? total / featured.length : 0;

  return (
    <>
      <Section>
        <PageHead title="Шоурил 2026" sub={`${settings.brand.person} · ${settings.brand.city} · ${reel?.duration ?? "—"}`} />
      </Section>

      <Section>
        <Container className="pb-12 md:pb-20">
          {reel ? (
            <ShowreelBlock video={reel} loop={reel.loop} title="Шоурил 2026" />
          ) : (
            <p className="mono border-y border-rule py-10 text-center text-meta">шоурил появится здесь</p>
          )}
        </Container>
      </Section>

      {featured.length > 0 && (
        <Section>
          <Container className="py-12 md:py-20">
            <p className="mono text-meta">[ что в риле ]</p>
            <ol className="mt-6 border-t border-rule">
              {featured.map((c, i) => (
                <li key={c.slug} className="border-b border-rule">
                  <Link href={`/work/${c.slug}`} className="group flex min-h-14 items-center gap-4 py-3 md:gap-8">
                    <span className="mono w-14 shrink-0 text-meta tabular-nums">{timecode(step * i)}</span>
                    <span className="disp text-h3 min-w-0 flex-1 truncate whitespace-nowrap transition-colors duration-300 group-hover:text-signal">
                      {c.title}
                    </span>
                    <span className="mono hidden text-meta md:block">{c.client}</span>
                    <span className="mono text-meta transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-signal">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      <Section>
        <Container className="flex flex-col items-start gap-6 py-12 pb-[calc(64px+var(--sticky-h))] md:py-20 md:pb-[calc(96px+var(--sticky-h))]">
          <p className="disp text-h2">Хочу так же</p>
          <Button variant="signal" size="xl" href={waLink(prefill("home"))}>
            Обсудить съёмку · WhatsApp
          </Button>
        </Container>
      </Section>
    </>
  );
}
