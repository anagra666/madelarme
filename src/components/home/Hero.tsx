import Link from "next/link";
import CinemaVideo from "@/components/media/CinemaVideo";
import Button from "@/components/ui/Button";
import { settings } from "@/lib/content";
import { prefill, waLink } from "@/lib/links";
import HeroOSD, { HeroClock } from "./HeroOSD";
import HeroWordmark, { HeroFade } from "./HeroWordmark";

/** Разделитель «·» перед пунктом моно-строки (ширина = сдвиг ряда -ml-6) */
const SEP = "whitespace-nowrap before:inline-block before:w-6 before:text-center before:content-['·']";

/** «заглавными.» → [«заглавными», true] — точка красится в signal */
function splitDot(s: string): [string, boolean] {
  return s.endsWith(".") ? [s.slice(0, -1), true] : [s, false];
}

/**
 * Первый экран: шоурил-луп на весь экран, моно-строка, OSD камеры, H1 «СНИМАЮ / ЗАГЛАВНЫМИ.»
 * и CTA. Всё, что читается, отрендерено сервером. Вордмарк-подпись — только десктоп.
 */
export default function Hero() {
  const { brand, manifest, heroSub, showreel } = settings;
  const wa = waLink(prefill("home"));
  const reelLabel = showreel ? `▶ Шоурил ${showreel.duration}` : "▶ Шоурил";

  return (
    /* isolation-auto!: grain делает секцию stacking context (isolate), и fixed-вордмарк (z-45) не мог подняться
       над шапкой (z-40) — «посадка» в слот шапки пряталась под её фоном */
    <section id="hero" className="grain relative h-svh overflow-hidden bg-ink text-milk isolation-auto!">
      {showreel && (
        <CinemaVideo loop={showreel.loop} priority pauseButton mode="visible" className="absolute inset-0" alt="" />
      )}
      <div className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-[60%]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-ink/80 to-transparent" aria-hidden="true" />
      <HeroWordmark />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-gutter pb-[calc(var(--spacing-gutter)+60px)] pt-[calc(var(--header-h)+8px)] lg:pt-[calc(var(--header-h)+12px)]">
        {/* верх: моно-строка слева, OSD справа (десктоп) */}
        <div className="flex items-start justify-between gap-6">
          {/* «·» рисует каждый пункт перед собой; ряд сдвинут на ширину разделителя внутри overflow-x: clip —
              у пункта в начале строки точка срезается, висячего «· [ 14:00 ALMT ]» на телефоне нет */}
          <p className="mono-sm lg:mono min-w-0 overflow-x-clip text-milk/85">
            <span className="-ml-6 flex flex-wrap items-center gap-y-1">
              <span className={`hidden sm:inline ${SEP}`}>[ {brand.person} ]</span>
              <span className={SEP}>[ {brand.role} ]</span>
              <span className={SEP}>[ {brand.city}, KZ ]</span>
              <HeroClock className={SEP} />
            </span>
          </p>
          <div className="hidden shrink-0 lg:block">
            <HeroOSD />
          </div>
        </div>

        {/* низ: H1 + подпись слева, кнопки справа (десктоп) / в столбик (телефон) */}
        <HeroFade className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <h1 className="disp text-[15vw] lg:text-[clamp(72px,9.5vw,150px)]">
              {manifest.map((line) => {
                const [word, dot] = splitDot(line);
                return (
                  <span key={line} className="block">
                    {word}
                    {dot && <span className="text-signal">.</span>}
                  </span>
                );
              })}
            </h1>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-snug text-milk/85 lg:mt-6 lg:text-[17px]">{heroSub}</p>
          </div>

          <div className="pointer-events-auto flex shrink-0 flex-col items-stretch gap-3 sm:items-start lg:flex-row lg:items-center lg:gap-3">
            <Button variant="signal" size="lg" href={wa} className="w-full sm:w-auto">
              Написать в WhatsApp
            </Button>
            <div className="hidden lg:block">
              <Button variant="outline" size="lg" href="/showreel">
                {reelLabel}
              </Button>
            </div>
            <Link
              href="/showreel"
              className="mono inline-flex h-11 items-center justify-center gap-2 self-center text-milk/85 hover:text-signal sm:self-start lg:hidden"
            >
              шоурил <span aria-hidden="true">▶</span>
            </Link>
          </div>
        </HeroFade>
      </div>
    </section>
  );
}
