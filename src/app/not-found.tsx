import Link from "next/link";
import Button from "@/components/ui/Button";
import { Section, Container } from "@/components/ui/Section";
import Countdown from "@/components/pages/Countdown";
import { prefill, waLink } from "@/lib/links";

export default function NotFound() {
  return (
    <Section className="min-h-svh">
      <Container className="flex min-h-svh flex-col justify-between pt-[calc(var(--header-h)+24px)] pb-[calc(40px+var(--sticky-h))]">
        <div className="flex items-start justify-between gap-6">
          <p className="mono text-meta">404 · TAKE 03</p>
          <p className="mono text-signal">REC ●</p>
        </div>

        <div className="flex flex-col items-start gap-6 py-10 md:flex-row md:items-end md:justify-between">
          <h1 className="disp text-h1 max-w-[8ch]">Кадр не найден</h1>
          <div className="flex items-end gap-4">
            <span className="mono text-meta">отсчёт</span>
            <Countdown from={8} to={3} className="disp text-h1 tabular-nums text-signal" />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-rule pt-6 md:flex-row md:items-center md:gap-4">
          <Button variant="outline" size="lg" href="/work">
            Работы
          </Button>
          <Button variant="signal" size="lg" href={waLink(prefill("home"))}>
            Написать в WhatsApp
          </Button>
          <Link href="/" className="mono mt-2 inline-flex h-11 items-center text-meta hover:text-signal md:ml-auto md:mt-0">
            ← на главную
          </Link>
        </div>
      </Container>
    </Section>
  );
}
