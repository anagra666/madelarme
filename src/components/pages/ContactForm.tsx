"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { AVAILABILITY_ON, DateStatus } from "@/components/pages/StatusLine";
import type { FormatChip } from "@/lib/content";
import { leadWaLink, sendLead, type LeadPayload } from "@/lib/lead";
import { cn } from "@/lib/utils";

/** ok — сервер принял; wa — статика: WhatsApp открыт с текстом, но заявку ещё надо отправить там; error — fallback */
type Status = "idle" | "sending" | "ok" | "wa" | "error";

/* рамка meta/80, а не rule: у rule на ink контраст 1.3:1, поле почти не видно (WCAG 1.4.11 — 3:1; meta/80 даёт 3.9:1) */
const field =
  "h-14 w-full border border-meta/80 bg-transparent px-4 text-[17px] text-milk placeholder:text-meta focus:border-milk";

/** Форма заявки: 5 полей, без email. POST JSON → /api/lead (формат уходит человеческим названием, не slug). */
export default function ContactForm({ formats, waHref }: { formats: FormatChip[]; waHref: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [format, setFormat] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [lead, setLead] = useState<LeadPayload | null>(null);
  /* поле «Когда» остаётся неуправляемым (FormData), значение — только для статуса занятости */
  const [when, setWhen] = useState("");
  const whenStatusId = useId();
  /* ниже lg показываем только основные форматы + чип «Все форматы (N)»; если основных в данных нет - показываем все */
  const [allFormats, setAllFormats] = useState(false);
  const anyPrimary = formats.some((f) => f.primary);
  const isMain = (f: FormatChip) => !anyPrimary || !!f.primary;
  const firstExtra = formats.find((f) => !isMain(f))?.slug;
  const extraRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  /* honeypot-тайминг: сколько форма открыта до отправки */
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  /* результат вместо формы: фокус на него, иначе он остаётся на <body> */
  useEffect(() => {
    if (status === "ok" || status === "wa") statusRef.current?.focus();
  }, [status]);
  /* чип «Все форматы» исчезает по клику: фокус уходит на первый появившийся чип */
  useEffect(() => { if (allFormats) extraRef.current?.focus({ preventScroll: true }); }, [allFormats]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const fd = new FormData(e.currentTarget);
    const payload: LeadPayload = {
      name: String(fd.get("name") ?? "").trim(),
      contact: String(fd.get("contact") ?? "").trim(),
      format: formats.find((f) => f.slug === format)?.label || undefined,
      when: String(fd.get("when") ?? "").trim() || undefined,
      message: String(fd.get("message") ?? "").trim() || undefined,
      consent: true,
      website: String(fd.get("hp_note") ?? "").trim() || undefined,
      elapsed: Date.now() - startedAt.current,
    };
    /* sendLead — синхронно, до первого await: на статике он открывает WhatsApp, и браузер должен видеть жест */
    const result = sendLead(payload);
    setLead(payload);
    setStatus("sending");
    const r = await result;
    setStatus(r === "sent" ? "ok" : r === "wa" ? "wa" : "error");
  }

  if (status === "ok") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="border border-meta/60 p-6 outline-none md:p-10">
        <p className="disp text-h2">Получила!</p>
        <p className="mono mt-4 text-meta">Напишу сегодня</p>
      </div>
    );
  }

  if (status === "wa" && lead) {
    /* попап мог быть заблокирован (встроенный браузер Instagram) или WhatsApp закрыли — кнопка остаётся */
    return (
      <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="border border-meta/60 p-6 outline-none md:p-10">
        <p className="disp text-h2">Почти готово</p>
        <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed">
          Осталось нажать «Отправить» в WhatsApp — текст заявки уже там. Если WhatsApp не открылся, нажмите кнопку ниже.
        </p>
        <Button variant="signal" size="xl" href={leadWaLink(lead)} className="mt-6 w-full">
          Открыть WhatsApp
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative flex flex-col gap-4">
      {/* honeypot: люди не видят и не табают, боты заполняют */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
        <label>Не заполняйте<input type="text" name="hp_note" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Имя</span>
        <input name="name" required maxLength={80} autoComplete="name" className={field} placeholder="Как к вам обращаться" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Телефон или ник</span>
        <input name="contact" required maxLength={120} autoComplete="tel" inputMode="text" className={field} placeholder="+7 … или @instagram" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mono mb-2 text-meta">Формат</legend>
        <div className="flex flex-wrap gap-2">
          {formats.map((f) => {
            const on = f.slug === format;
            return (
              <button
                key={f.slug}
                ref={f.slug === firstExtra ? extraRef : undefined}
                type="button"
                aria-pressed={on}
                onClick={() => setFormat(on ? "" : f.slug)}
                className={cn(
                  "mono h-11 border px-3 transition-colors duration-300 ease-out-expo",
                  on ? "border-signal bg-signal text-ink" : "border-meta/80 text-milk hover:border-milk",
                  !isMain(f) && !on && !allFormats && "max-lg:hidden",
                )}
              >
                {f.label}
              </button>
            );
          })}
          {firstExtra !== undefined && !allFormats && (
            <button
              type="button"
              aria-expanded={false}
              onClick={() => setAllFormats(true)}
              className="mono h-11 border border-dashed border-meta/80 px-3 text-meta transition-colors hover:border-milk hover:text-milk lg:hidden"
            >
              Все форматы ({formats.length})
            </button>
          )}
        </div>
      </fieldset>

      <div>
        <label className="flex flex-col gap-2">
          <span className="mono text-meta">Когда</span>
          <input
            name="when"
            maxLength={80}
            className={field}
            placeholder="12 июля 2027 или «ещё думаем»"
            onChange={(e) => setWhen(e.target.value)}
            aria-describedby={AVAILABILITY_ON ? whenStatusId : undefined}
          />
        </label>
        {AVAILABILITY_ON && <DateStatus id={whenStatusId} value={when} className="mt-3" />}
      </div>
      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Пару слов</span>
        <textarea name="message" rows={4} maxLength={2000} className={cn(field, "h-auto min-h-28 py-4")} placeholder="Где, сколько гостей, что для вас важно" />
      </label>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 appearance-none border border-meta checked:border-signal checked:bg-signal"
        />
        <span className="text-[15px] leading-snug text-meta">
          Согласна(ен) на обработку персональных{"\u00a0"}данных
        </span>
      </label>
      <Link href="/privacy" target="_blank" rel="noopener" className="mono-sm -mt-3 inline-flex min-h-11 items-center self-start text-meta underline underline-offset-4 hover:text-milk">
        как я их храню
      </Link>

      {status === "error" && (
        <div role="alert" className="border border-signal p-4">
          <p className="mono text-signal">Не отправилось</p>
          <p className="mt-2 text-[16px] text-meta">Напишите в WhatsApp — так даже быстрее.</p>
          <Button variant="signal" size="lg" href={lead ? leadWaLink(lead) : waHref} className="mt-4 w-full">
            Написать в WhatsApp
          </Button>
        </div>
      )}

      <Button type="submit" variant="signal" size="xl" aria-disabled={status === "sending" || undefined} className="w-full aria-disabled:cursor-wait aria-disabled:opacity-70">
        {status === "sending" ? "Отправляю…" : "Отправить"}
      </Button>
    </form>
  );
}
