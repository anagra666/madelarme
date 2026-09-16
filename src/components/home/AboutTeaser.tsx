import Image from "next/image";
import { settings } from "@/lib/content";
import { Reveal, Line } from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { Section, Eyebrow, Container } from "@/components/ui/Section";
import AlmatyClock from "./AlmatyClock.client";

const TITLE = ["Я Маша.", "Снимаю одна,", "чтобы вы забыли,", "что вас снимают."];

/** 07 · Привет, я Маша — портрет, заголовок, два абзаца, статус-строка, счётчики */
export default function AboutTeaser() {
  const { about, counters, season, statusNow, brand } = settings;
  const portrait = about.portrait;
  const paragraphs = about.paragraphs.slice(0, 2);

  return (
    <Section paper aria-labelledby="about-title" className="py-[clamp(64px,10vw,160px)]">
      <Container>
        <Eyebrow className="mb-8 lg:mb-12">[ 07 ] · ПРИВЕТ, Я МАША</Eyebrow>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-gutter">
          {/* портрет 4:5 */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-2 lg:col-span-5">
            {portrait?.src ? (
              <Image
                src={portrait.src}
                alt={portrait.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="mono absolute inset-0 grid place-items-center text-meta">[ портрет ]</div>
            )}
            <span className="mono-sm absolute bottom-3 left-3 text-milk [--color-milk:#ece7df]">
              {brand.person} · {brand.role}
            </span>
          </div>

          {/* текст */}
          <div className="flex flex-col gap-8 lg:col-span-7 lg:gap-10">
            <Reveal as="h2" className="disp text-h2" stagger={0.08}>
              {TITLE.map((l) => (
                <Line key={l}>
                  <span id={l === TITLE[0] ? "about-title" : undefined}>{l}</span>
                </Line>
              ))}
            </Reveal>

            <div className="grid max-w-[60ch] gap-4 text-[16px] leading-relaxed lg:text-[18px]">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            <div className="mono flex flex-wrap gap-x-2 gap-y-1 border-t border-rule pt-3 text-meta">
              <span>{brand.city}</span>
              <span aria-hidden="true">·</span>
              <AlmatyClock />
              <span aria-hidden="true">·</span>
              <span>{season}</span>
              <span aria-hidden="true">·</span>
              <span className="text-milk">сейчас: {statusNow}</span>
            </div>

            {counters && counters.length > 0 && (
              <ul className="grid grid-cols-2 gap-y-6 border-t border-rule pt-6 sm:grid-cols-4">
                {counters.map((c) => (
                  <li key={c.label} className="flex flex-col gap-1">
                    <span className="disp text-h3">{c.value}</span>
                    <span className="mono-sm text-meta">{c.label}</span>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <Button href="/about" variant="paper" size="lg" className="w-full [--color-milk:#ece7df] sm:w-auto">
                обо мне подробнее →
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
