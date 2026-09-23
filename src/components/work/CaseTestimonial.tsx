import type { Testimonial } from "@/content/types";
import { Line, Reveal } from "@/components/ui/Reveal";

/** Цитата клиента дисплеем + моно-подпись. */
export default function CaseTestimonial({ t }: { t: Testimonial }) {
  return (
    <section className="border-t border-rule px-gutter py-12 lg:py-20" aria-label="Отзыв клиента">
      {/* ширина строки — в em дисплейного кегля самой цитаты (ch фигуры считался бы по body-шрифту) */}
      <figure>
        <Reveal as="div">
          <Line>
            <blockquote className="disp text-h3 max-w-[16em] [text-wrap:balance]">«{t.quote}»</blockquote>
          </Line>
        </Reveal>
        <figcaption className="mono mt-6 text-meta">
          — <span className="text-milk">{t.author}</span>
          {t.role && ` · ${t.role}`}
          {!t.confirmed && <span className="mono-sm ml-3 inline-block whitespace-nowrap opacity-60">[ демо ]</span>}
        </figcaption>
      </figure>
    </section>
  );
}
