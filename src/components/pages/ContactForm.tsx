"use client";

import { sendLead } from "@/lib/lead";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface FormatChip {
  slug: string;
  label: string;
}

type Status = "idle" | "sending" | "ok" | "error";

const field =
  "h-14 w-full border border-rule bg-transparent px-4 text-[17px] text-milk placeholder:text-meta/70 focus:border-milk focus:outline-none";

/** Форма заявки: 5 полей, без email. POST JSON → /api/lead (формат уходит человеческим названием, не slug). */
export default function ContactForm({ formats, waHref }: { formats: FormatChip[]; waHref: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [format, setFormat] = useState<string>("");
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") ?? "").trim(),
      contact: String(fd.get("contact") ?? "").trim(),
      format: formats.find((f) => f.slug === format)?.label || undefined,
      when: String(fd.get("when") ?? "").trim() || undefined,
      message: String(fd.get("message") ?? "").trim() || undefined,
      consent,
    };
    setStatus("sending");
    setStatus((await sendLead({ ...body, consent: true })) ? "ok" : "error");
  }

  if (status === "ok") {
    return (
      <div role="status" aria-live="polite" className="border border-rule p-6 md:p-10">
        <p className="disp text-h2">Получила!</p>
        <p className="mono mt-4 text-meta">Напишу сегодня</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Имя</span>
        <input name="name" required autoComplete="name" className={field} placeholder="Как к вам обращаться" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Телефон или ник</span>
        <input name="contact" required autoComplete="tel" inputMode="text" className={field} placeholder="+7 … или @instagram" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mono mb-2 text-meta">Формат</legend>
        <div className="flex flex-wrap gap-2">
          {formats.map((f) => {
            const on = f.slug === format;
            return (
              <button
                key={f.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setFormat(on ? "" : f.slug)}
                className={cn(
                  "mono h-11 border px-3 transition-colors duration-300 ease-out-expo",
                  on ? "border-signal bg-signal text-ink" : "border-rule text-milk hover:border-milk",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Когда</span>
        <input name="when" className={field} placeholder="12 июля 2027, Алматы — или «ещё думаем»" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="mono text-meta">Пару слов</span>
        <textarea name="message" rows={4} className={cn(field, "h-auto min-h-28 py-4")} placeholder="Где, сколько гостей, что для вас важно" />
      </label>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 appearance-none border border-rule checked:border-signal checked:bg-signal"
        />
        <span className="text-[14px] leading-snug text-meta">
          Согласна(ен) на обработку персональных данных —{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-milk">
            как я их храню
          </Link>
        </span>
      </label>

      {status === "error" && (
        <div role="alert" className="border border-signal p-4">
          <p className="mono text-signal">Не отправилось</p>
          <p className="mt-2 text-[15px] text-meta">Напишите в WhatsApp — так даже быстрее.</p>
          <Button variant="signal" size="lg" href={waHref} className="mt-4 w-full">
            Написать в WhatsApp
          </Button>
        </div>
      )}

      <Button type="submit" variant="signal" size="xl" disabled={status === "sending" || !consent} className="w-full disabled:cursor-not-allowed disabled:opacity-50">
        {status === "sending" ? "Отправляю…" : "Отправить"}
      </Button>
    </form>
  );
}
