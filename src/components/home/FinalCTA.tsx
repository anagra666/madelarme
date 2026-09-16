import { settings } from "@/lib/content";
import { waLink, tgLink, igDmLink, telLink, prefill } from "@/lib/links";
import Marquee from "@/components/ui/Marquee";
import Button from "@/components/ui/Button";
import { Section, Container } from "@/components/ui/Section";
import CopyEmail from "./CopyEmail.client";

/** 10 · Давай снимать — финальный CTA: контурная марка за текстом, три мессенджера, email, телефон */
export default function FinalCTA() {
  const { season, contacts } = settings;

  return (
    <Section
      id="cta"
      aria-labelledby="cta-title"
      className="overflow-hidden bg-ink"
    >
      <div className="relative flex w-full items-center pb-[calc(var(--sticky-h)+env(safe-area-inset-bottom)+clamp(48px,8vw,96px))] pt-[clamp(64px,10vw,160px)] lg:min-h-svh lg:pb-[clamp(64px,10vw,160px)]">
      {/* контурная марка на фоне — декорация */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center">
        <Marquee duration={48} gap="0.35em" className="w-full">
          <span className="disp text-h1 whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgb(236_231_223/0.28)]">
            ДАВАЙ СНИМАТЬ ·
          </span>
          <span className="disp text-h1 whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgb(236_231_223/0.28)]">
            ДАВАЙ СНИМАТЬ ·
          </span>
        </Marquee>
      </div>

      <Container className="relative w-full">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-8 text-center lg:gap-10">
          <h2 id="cta-title" className="sr-only">Давай снимать</h2>
          <p className="mono text-meta">
            <span className="text-signal">●</span> {season} · проверить дату
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
            <Button href={waLink(prefill("home"))} variant="signal" size="lg" className="w-full sm:w-auto">
              Написать в WhatsApp
            </Button>
            <Button href={tgLink()} variant="outline" size="lg" className="w-full sm:w-auto">
              Telegram
            </Button>
            <Button href={igDmLink()} variant="ghost" size="lg" className="w-full sm:w-auto">
              Instagram
            </Button>
          </div>

          <div className="mono flex flex-col items-center gap-2 text-meta sm:flex-row sm:gap-6">
            <CopyEmail email={contacts.email} />
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <a href={telLink()} className="inline-flex min-h-11 items-center text-milk hover:text-signal">
              {contacts.phoneDisplay}
            </a>
          </div>
        </div>
      </Container>
      </div>
    </Section>
  );
}
