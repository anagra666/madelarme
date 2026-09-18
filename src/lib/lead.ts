import { waLink } from "@/lib/links";

export interface LeadPayload {
  name: string;
  contact: string;
  format?: string;
  when?: string;
  message?: string;
  consent: true;
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

/** Отправка заявки: POST /api/lead, а без API — переход в WhatsApp с собранным текстом. Возвращает true при успехе. */
export async function sendLead(p: LeadPayload, intro?: string): Promise<boolean> {
  if (STATIC_SITE) {
    window.open(waLink(leadToText(p, intro)), "_blank", "noopener");
    return true;
  }
  try {
    const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    const j = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(r.ok && j?.ok);
  } catch {
    return false;
  }
}
