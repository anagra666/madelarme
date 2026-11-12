import { NextResponse } from "next/server";
import { getFormatChips } from "@/lib/content";

export const runtime = "nodejs";

/** Заявка с формы /contact. Проверки запроса → валидация → Telegram-бот → { ok: true }. */
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

/** Общий потолок на всех: Telegram ограничивает один чат (~20 сообщений в минуту), стая ботов не должна вытеснить живые заявки */
const GLOBAL_LIMIT = 20;
/** Настоящая заявка весит ~6 КБ (2000 символов кириллицы и остальные поля); 64 КБ с запасом на длинную вставку */
const MAX_BODY = 64 * 1024;
/** Быстрее этого форму не заполнить руками — отправка считается ботом; живой человек с автозаполнением получает неуспех и WhatsApp-фолбэк */
const MIN_FILL_MS = 3000;

function rateLimited(ip: string, limit = LIMIT): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= limit) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return false;
}

/* допустимые подписи формата — те же, что строит getFormatChips() для чипов формы */
const FORMAT_LABELS = new Set(getFormatChips().map((c) => c.label));

/* C0/C1-управляющие (кроме \t \n \r — их разбираем отдельно), мягкий перенос, ZWSP, LRM/RLM, bidi-вставки и изоляты,
   word joiner, BOM. ZWJ/ZWNJ оставляем: нужны эмодзи и некоторым письменностям. */
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** undefined = пусто или не передано, null = неверный тип или длиннее лимита (400, без тихой обрезки) */
function clean(v: unknown, max: number, multiline = false): string | undefined | null {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return null;
  let s = v.replace(/\r\n?/g, "\n").replace(INVISIBLE, "");
  s = multiline
    ? s.replace(/[\u2028\u2029]/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    : s.replace(/\s+/g, " ").trim(); /* \s ловит и \n, и U+2028/2029: подделать лишнюю строку в Telegram нельзя */
  if (s.length > max) return null;
  return s || undefined;
}

function parse(body: unknown): Lead | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const name = clean(b.name, 80);
  const contact = clean(b.contact, 120);
  const format = clean(b.format, 80);
  const when = clean(b.when, 100);
  const message = clean(b.message, 2200, true); // 2000 набранных + пометка «[со страницы …]» из панели
  if (!name || !contact || b.consent !== true) return null;
  if (format === null || when === null || message === null) return null;
  return {
    name,
    contact,
    /* устаревшая или подделанная подпись отбрасывается, сама заявка не теряется */
    format: format && FORMAT_LABELS.has(format) ? format : undefined,
    when,
    message,
    consent: true,
  };
}

/* Telegram без parse_mode: текст уходит как есть, HTML/Markdown-разметка не интерпретируется (не добавлять parse_mode без экранирования & < >) */
function render(lead: Lead): string {
  return [
    "Заявка с сайта madelarme",
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
    lead.format && `Формат: ${lead.format}`,
    lead.when && `Когда: ${lead.when}`,
    lead.message && `Сообщение: ${lead.message}`,
    `— ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * IP для rate-limit. X-Real-IP / X-Forwarded-For доверяем, только если деплой сам сказал TRUST_PROXY=1:
 * наш nginx перезаписывает X-Real-IP ($remote_addr), а Node слушает 127.0.0.1.
 * Без доверенного прокси заголовки подделывает клиент, поэтому все запросы делят одну корзину (fail closed).
 * IP нужен только для лимита и в Telegram не уходит.
 */
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
function clientIp(req: Request): string {
  if (!TRUST_PROXY) return "direct";
  const ip =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown";
  return ip.slice(0, 64);
}

/** Только запросы с нашего же сайта: Origin должен совпасть с Host (или X-Forwarded-Host). Сравниваем hostname: nginx со своим `Host $host` порт отбрасывает. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host");
  if (!origin || !host) return false; // нет Origin или он "null" - отказ
  try {
    return new URL(origin).hostname === new URL(`http://${host}`).hostname;
  } catch {
    return false;
  }
}

/** JSON обязателен: чужой сайт не отправит такой POST без CORS-preflight, а у нас на него нет ответа с Access-Control-Allow-Origin. */
function isJson(req: Request): boolean {
  return (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase() === "application/json";
}

/** Читает тело не больше max байт. null - тело больше (дочитывать не стараемся). */
async function readCapped(req: Request, max: number): Promise<string | null> {
  const reader = req.body?.getReader();
  if (!reader) return "";
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel().catch(() => {}); return null; }
    parts.push(value);
  }
  return Buffer.concat(parts).toString("utf8");
}

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  /* подделанные и чужие запросы отсекаем до лимитера, чтобы они не съедали его квоту */
  if (!sameOrigin(req)) return fail("forbidden", 403);
  if (!isJson(req)) return fail("unsupported_media_type", 415);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return fail("too_large", 413);

  const ip = clientIp(req);
  if (rateLimited(ip)) return fail("rate_limited", 429);

  const raw = await readCapped(req, MAX_BODY);
  if (raw === null) return fail("too_large", 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("invalid_json", 400);
  }

  /* ловушки для ботов: скрытое поле формы (в теле — website) и время заполнения. Обе отвечают ошибкой, а не «ок»:
     если ловушку заполнил менеджер паролей или человек отправил слишком быстро, форма покажет WhatsApp-фолбэк и заявка не потеряется.
     IP в лог не пишем: он нужен только для лимита */
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    if (typeof b.website === "string" && b.website.trim() !== "") {
      console.warn("[lead] honeypot");
      return fail("rejected", 400);
    }
    if (typeof b.elapsed === "number" && b.elapsed < MIN_FILL_MS) {
      console.warn("[lead] too fast");
      return fail("too_fast", 400);
    }
  }

  const lead = parse(body);
  if (!lead) return fail("invalid_body", 400);

  const text = render(lead);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;

  if (token && chat) {
    /* глобальный потолок считаем только для заявок, которые реально уйдут в Telegram */
    if (rateLimited("*", GLOBAL_LIMIT)) return fail("rate_limited", 429);
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) {
        console.error("[lead] telegram error", r.status, await r.text().catch(() => ""));
        return fail("delivery_failed", 502);
      }
    } catch (e) {
      console.error("[lead] telegram fetch failed", e);
      return fail("delivery_failed", 502);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.log("[lead] (dev, Telegram не настроен)\n" + text);
  } else {
    /* без бота заявка никому не дойдёт: честная ошибка, форма предложит WhatsApp. Текст заявки в лог не пишем */
    console.error("[lead] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы, заявка НЕ доставлена");
    return fail("delivery_unconfigured", 503);
  }

  return NextResponse.json({ ok: true });
}
