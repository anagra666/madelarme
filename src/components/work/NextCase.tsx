import Image from "next/image";
import Link from "next/link";
import type { Case } from "@/content/types";
import { waLink, prefill } from "@/lib/links";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

/**
 * «СЛЕДУЮЩАЯ → {title}» гигантской строкой (≤14 символов — в одну строку, длиннее — перенос с balance;
 * hover — постер за строкой, только картинка),
 * «← {prev}» мельче, затем мини-CTA «Хочу как у {clientGen}» в WhatsApp (clientGen — клиент в родительном падеже;
 * без него — «Хочу как в «{title}»», как в тексте предзаполнения: «как у «Тау-той»» и имя в именительном после «у» неграмотны).
 */
export default function NextCase({ c, next, prev }: { c: Case; next?: Case; prev?: Case }) {
  return (
    <section className="border-t border-rule" aria-label="Следующий кейс">
      {next && (
        <Link
          href={`/work/${next.slug}`}
          className="group relative block overflow-hidden px-gutter py-14 lg:py-24"
        >
          <Image
            src={next.loop.posterH}
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none object-cover opacity-0 transition-opacity duration-700 ease-out-expo group-hover:opacity-50 group-focus-visible:opacity-50 motion-reduce:transition-none"
          />
          <span className="relative z-10 block">
            <span className="mono block text-meta">[ Следующая ]</span>
            <span
              className={cn(
                "disp text-h2 mt-3 block transition-colors duration-300 group-hover:text-signal",
                next.title.length > 14 ? "[text-wrap:balance]" : "whitespace-nowrap",
              )}
            >
              → {next.title}
            </span>
          </span>
        </Link>
      )}

      <div className="flex flex-col gap-6 border-t border-rule px-gutter py-6 lg:flex-row lg:items-center lg:justify-between">
        {prev ? (
          <Link
            href={`/work/${prev.slug}`}
            className="mono inline-flex h-11 items-center gap-2 text-meta transition-colors hover:text-signal"
          >
            ← <span className="disp text-[22px] normal-case text-milk">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        <Button variant="signal" size="lg" href={waLink(prefill("case", c.title))} className="w-full lg:w-auto">
          {c.clientGen ? `Хочу как у ${c.clientGen}` : `Хочу как в «${c.title}»`}
        </Button>
      </div>
    </section>
  );
}
