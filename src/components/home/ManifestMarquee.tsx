import Link from "next/link";
import Marquee from "@/components/ui/Marquee";

/**
 * Марки-манифест: единственный полностью сигнальный блок главной. Каждое слово — ссылка на формат.
 * Слова — упор Маши на репортаж (ответы 2026-11). Прощания здесь нет и не будет: бегущей сигнальной строке оно не подходит.
 */
const MARKS: { label: string; slug: string }[] = [
  { label: "Свадьба", slug: "wedding-film" },
  { label: "Лав-стори", slug: "love-story" },
  { label: "Ивент", slug: "aftermovie" },
  { label: "Корпоратив", slug: "corporate" },
  { label: "Бэкстейдж", slug: "backstage" },
  { label: "День рождения", slug: "birthday" },
  { label: "Дрон и FPV", slug: "drone" },
];

export default function ManifestMarquee() {
  return (
    <section id="manifest" aria-label="Бегущая строка форматов" className="flex min-h-[10vh] items-center overflow-hidden bg-signal text-ink lg:min-h-[14vh]">
      {/* слов стало больше и они длиннее — оборот дольше, чтобы скорость строки осталась прежней */}
      <Marquee duration={72} gap="0" className="w-full py-[0.5vh]">
        {MARKS.map(({ label, slug }) => (
          <span key={slug} className="flex items-center">
            <Link
              href={`/formats/${slug}`}
              className="disp whitespace-nowrap px-[0.12em] text-[14vw] leading-none transition-colors duration-300 ease-out-expo hover:text-milk focus-visible:outline-ink focus-visible:-outline-offset-4 lg:text-[9vw]"
            >
              {label}
            </Link>
            {/* оптический центр: точка моно сидит ниже центра капса дисплейного — поднимаем на 0.15em */}
            <span aria-hidden="true" className="-translate-y-[0.15em] px-[3vw] font-mono text-[6vw] leading-none lg:px-[1.5vw] lg:text-[3vw]">
              ·
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
