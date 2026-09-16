import type { Testimonial } from "@/content/types";
import { Line, Reveal } from "@/components/ui/Reveal";

/** Цитата клиента дисплеем + моно-подпись. */
export default function CaseTestimonial({ t }: { t: Testimonial }) {
  return (
    <section className="border-t border-rule px-gutter py-12 lg:py-20" aria-label="Отзыв клиента">
      <figure className="max-w-[28ch] lg:max-w-[38ch]">
        <Reveal as="div">
          <Line>
            <blockquote className="disp text-h3 [text-wrap:balance]">«{t.quote}»</blockquote>
          </Line>
        </Reveal>
        <figcaption className="mono mt-6 text-meta">
          — <span className="text-milk">{t.author}</span>
          {t.role && ` · ${t.role}`}
          {!t.confirmed && <span className="mono-sm ml-3 opacity-60">[ плейсхолдер ]</span>}
        </figcaption>
      </figure>
    </section>
  );
}
