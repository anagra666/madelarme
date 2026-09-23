import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Заявка с формы /contact. Валидация → Telegram-бот (если настроен) → { ok: true }. */
interface Lead {
  name: string;
  contact: string;
  format?: string;
  when?: string;
  message?: string;
  consent: true;
}

const LIMIT = 5;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= LIMIT) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return false;
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

function parse(body: unknown): Lead | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const name = str(b.name, 120);
  const contact = str(b.contact, 120);
  if (!name || !contact || b.consent !== true) return null;
  return {
    name,
    contact,
    format: str(b.format, 80),
    when: str(b.when, 200),
    message: str(b.message, 2000),
    consent: true,
  };
}

function render(lead: Lead, ip: string): string {
  return [
    "Заявка с сайта madelarme",
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
    lead.format && `Формат: ${lead.format}`,
    lead.when && `Когда: ${lead.when}`,
    lead.message && `Сообщение: ${lead.message}`,
    `— ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })} · ${ip}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * IP для rate-limit. X-Real-IP ставит наш nginx ($remote_addr) — клиент его не подделает.
 * Без него берём ПОСЛЕДНИЙ элемент X-Forwarded-For: его дописывает ближайший прокси,
 * а первые элементы присылает сам клиент.
 */
function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "local"
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  /* honeypot: скрытое поле «website» люди не заполняют — боту отвечаем «ок», но никуда не шлём */
  if (body && typeof body === "object" && str((body as Record<string, unknown>).website, 200)) {
    return NextResponse.json({ ok: true });
  }
  const lead = parse(body);
  if (!lead) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const text = render(lead, ip);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;

  if (token && chat) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) {
        console.error("[lead] telegram error", r.status, await r.text().catch(() => ""));
        return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
      }
    } catch (e) {
      console.error("[lead] telegram fetch failed", e);
      return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }
  } else {
    console.log("[lead]\n" + text);
  }

  return NextResponse.json({ ok: true });
}
