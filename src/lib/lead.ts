import { waLink } from "@/lib/links";

export interface LeadPayload {
  name: string;
  contact: string;
  format?: string;
  when?: string;
  message?: string;
  consent: true;
  /** Ловушка для ботов: значение скрытого поля формы (name="hp_note" — имя, которое не узнаёт автозаполнение), у человека пустое. leadToText его не выводит. */
  website?: string;
  /** Миллисекунды от открытия формы до отправки. Сервер отвечает ошибкой, если быстрее 3 с (форма покажет WhatsApp-фолбэк). */
  elapsed?: number;
}

/** На статическом хостинге (NEXT_PUBLIC_STATIC=1) API нет — заявка уходит текстом в WhatsApp. */
export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC === "1";

export function leadToText(p: LeadPayload, intro?: string): string {
  return [
    intro ?? "Здравствуйте, Мария!",
    `Я ${p.name}${p.contact ? ` (${p.contact})` : ""}`,
    p.format && `Формат: ${p.format}`,
    p.when && `Когда: ${p.when}`,
    p.message,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Ссылка WhatsApp с полным текстом заявки — для кнопки «Открыть WhatsApp», если попап заблокирован. */
export function leadWaLink(p: LeadPayload, intro?: string): string {
  return waLink(leadToText(p, intro));
}

/**
 * Результат отправки:
 *  "sent" — заявка принята сервером (/api/lead) → показываем «Получила!»;
 *  "wa"   — статический сайт: открыт WhatsApp с готовым текстом, заявку ещё надо отправить там →
 *           показываем «Осталось нажать «Отправить» в WhatsApp» + постоянную кнопку leadWaLink();
 *  "fail" — ошибка сети/сервера → fallback на WhatsApp.
 * ВАЖНО: вызывать синхронно из обработчика клика/submit (до любых await) — иначе браузер заблокирует window.open.
 */
export type LeadResult = "sent" | "wa" | "fail";

export async function sendLead(p: LeadPayload, intro?: string): Promise<LeadResult> {
  if (STATIC_SITE) {
    if (p.website) return "wa"; // бот заполнил скрытое поле: WhatsApp не открываем
    window.open(leadWaLink(p, intro), "_blank", "noopener");
    return "wa";
  }
  try {
    const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    const j = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return r.ok && j?.ok ? "sent" : "fail";
  } catch {
    return "fail";
  }
}
