import { settings } from "@/lib/content";

/** Deep-link в WhatsApp с предзаполненным текстом. Номер — только цифры с кодом страны. */
export function waLink(text?: string): string {
  const t = text ?? settings.contacts.whatsappDefaultText;
  return `https://wa.me/${settings.contacts.phoneDigits}?text=${encodeURIComponent(t)}`;
}

export function tgLink(text?: string): string {
  const base = `https://t.me/${settings.contacts.telegram.replace(/^@/, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function igDmLink(): string {
  return `https://ig.me/m/${settings.contacts.instagram.replace(/^@/, "")}`;
}

export function igLink(): string {
  return `https://www.instagram.com/${settings.contacts.instagram.replace(/^@/, "")}/`;
}

export function telLink(): string {
  return `tel:+${settings.contacts.phoneDigits}`;
}

export type PrefillKind = keyof typeof settings.prefill;

/** Текст предзаполнения по типу страницы: {title} → название кейса/формата/коллекции */
export function prefill(kind: PrefillKind, title?: string): string {
  return settings.prefill[kind].replace("{title}", title ?? "");
}
