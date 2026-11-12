"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Check, Copy } from "lucide-react";
import { settings } from "@/lib/settings";
import { igDmLink, telLink, tgLink, waLink } from "@/lib/links";
import type { FormatChip } from "@/lib/content";
import { leadWaLink, sendLead, type LeadPayload } from "@/lib/lead";
import { useMediaQuery, useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  emitOverlay, InstagramGlyph, TelegramGlyph, useStickyPrefill, WhatsAppGlyph,
} from "@/components/layout/StickyCTA";
import { AVAILABILITY_ON, DateStatus } from "@/components/pages/StatusLine";

/* ── store: открыть панель из любого клиентского листа ────────────────── */
let panelOpen = false;
let lastTrigger: HTMLElement | null = null;
const subs = new Set<() => void>();
const notify = () => subs.forEach((fn) => fn());

export function openContactPanel() {
  if (panelOpen) return;
  lastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  panelOpen = true;
  notify();
}
export function closeContactPanel() {
  if (!panelOpen) return;
  panelOpen = false;
  notify();
}
function subscribe(fn: () => void) {
  subs.add(fn);
  return () => { subs.delete(fn); };
}

/** useContactPanel().open() — из [ НАПИСАТЬ ] в шапке, из CTA любой страницы */
export function useContactPanel() {
  const isOpen = useSyncExternalStore(subscribe, () => panelOpen, () => false);
  return { isOpen, open: openContactPanel, close: closeContactPanel };
}

/* ── focus trap (общий для меню и панели) ─────────────────────────────── */
/* iframe — чтобы Tab доходил до встроенного YouTube в плеере; input[tabindex=-1] — honeypot-поле форм */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]),select:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';

/**
 * Фокус на первый элемент при открытии, Tab по кругу, Esc → onClose, возврат фокуса на триггер.
 * returnTo — геттер (читается в эффекте, чтобы не трогать ref во время рендера).
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void,
  returnTo?: () => HTMLElement | null,
) {
  const getReturn = useRef(returnTo);
  const close = useRef(onClose);
  useEffect(() => { getReturn.current = returnTo; close.current = onClose; });
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const prev = getReturn.current?.() ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    /* data-focus-guard — сторож после iframe плеера: он только возвращает фокус в диалог, в круг Tab не входит */
    const items = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute("data-focus-guard") && (el.offsetParent !== null || el === document.activeElement),
    );
    const first = items().find((el) => el.dataset.autofocus !== undefined) ?? items()[0];
    const t = window.setTimeout(() => first?.focus({ preventScroll: true }), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current(); return; }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) return;
      const a = list[0], z = list[list.length - 1];
      /* фокус потерян (body, снятая кнопка) или на tabIndex=-1 блоке результата: ведём к ближайшему элементу диалога */
      const cur = document.activeElement as HTMLElement | null;
      if (!cur || !list.includes(cur)) {
        e.preventDefault();
        const inRoot = !!cur && root.contains(cur);
        const next = e.shiftKey
          ? [...list].reverse().find((el) => inRoot && cur!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) ?? z
          : list.find((el) => inRoot && cur!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) ?? a;
        next.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      prev?.focus({ preventScroll: true });
    };
  }, [ref, active]);
}

/* ── панель ────────────────────────────────────────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const;
/** sent — принято сервером; wa — статика: текст заявки открыт в WhatsApp, осталось отправить там */
type Status = "idle" | "sending" | "sent" | "wa" | "fail";

/** Чип формата собирает getFormatChips() на сервере (layout.tsx); в /api/lead уходит именно label. */
export type { FormatChip };

export default function ContactPanel({ formats }: { formats: FormatChip[] }) {
  const { isOpen, close } = useContactPanel();
  const pathname = usePathname();
  const text = useStickyPrefill();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();

  useScrollLock(isOpen);
  useFocusTrap(ref, isOpen, close, () => lastTrigger);
  useEffect(() => { if (isOpen) { emitOverlay(true); return () => emitOverlay(false); } }, [isOpen]);
  useEffect(() => { closeContactPanel(); }, [pathname]);

  const [copied, setCopied] = useState(false);
  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(settings.contacts.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { window.location.href = `mailto:${settings.contacts.email}`; }
  }, []);

  const [status, setStatus] = useState<Status>("idle");
  const [format, setFormat] = useState<string>("");
  const [draft, setDraft] = useState({ name: "", contact: "", when: "", message: "" });
  const [consent, setConsent] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const focusName = useRef(false);
  /* honeypot-тайминг: отсчёт с первого открытия панели (черновик живёт между открытиями) */
  const startedAt = useRef(0);
  useEffect(() => { if (isOpen && !startedAt.current) startedAt.current = Date.now(); }, [isOpen]);
  /* после «Получила!» / «Почти готово» фокус на блок результата, после «изменить заявку» - на имя */
  useEffect(() => {
    if (status === "sent" || status === "wa") statusRef.current?.focus({ preventScroll: true });
    else if (status === "idle" && focusName.current) { focusName.current = false; nameRef.current?.focus({ preventScroll: true }); }
  }, [status]);
  /* последняя заявка — для постоянной кнопки «Открыть WhatsApp» (попап мог быть заблокирован) */
  const [sent, setSent] = useState<LeadPayload | null>(null);

  /* панель живёт в шапке и не размонтируется: после закрытия снова показываем форму, а не «Получила!» */
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen && (status === "sent" || status === "wa")) {
      setStatus("idle");
      if (status === "sent") {
        setDraft({ name: "", contact: "", when: "", message: "" });
        setFormat("");
        setConsent(false);
      }
    }
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending" || !consent) return;
    /* honeypot читаем до sendLead: window.open на статике должен остаться в жесте пользователя */
    const website = String(new FormData(e.currentTarget).get("hp_note") ?? "").trim() || undefined;
    /* контракт /api/lead: name, contact, format?, when?, message?, consent: true */
    const formatLabel = formats.find((f) => f.slug === format)?.label;
    const payload: LeadPayload = {
      name: draft.name,
      contact: draft.contact,
      format: formatLabel,
      when: draft.when,
      /* метка страницы первой и с обрезанным путём: длинный 404-URL не вытеснит текст и не выбьет из лимита сервера */
      message: [`[со страницы ${pathname.slice(0, 80)}]`, draft.message].filter(Boolean).join("\n"),
      consent: true,
      website,
      elapsed: Date.now() - startedAt.current,
    };
    /* sendLead — синхронно, до первого await: на статике он открывает WhatsApp по жесту пользователя */
    const pending = sendLead(payload, text);
    setSent(payload);
    setStatus("sending");
    const result = await pending;
    /* заявка ушла - следующая считается заново с открытия панели */
    if (result === "sent") startedAt.current = 0;
    setStatus(result);
  };

  const fallbackText = [
    text,
    draft.name && `Я ${draft.name}`,
    format && `формат: ${formats.find((f) => f.slug === format)?.label ?? format}`,
    draft.when && `когда: ${draft.when}`,
    draft.message,
  ].filter(Boolean).join(". ");

  const slide = desktop ? { x: "100%" } : { y: "100%" };
  const rest = { x: 0, y: 0 };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="contact"
          className="fixed inset-0 z-60"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
        >
          <button type="button" aria-label="Закрыть" onClick={close} className="absolute inset-0 bg-ink/70" tabIndex={-1} />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            data-lenis-prevent
            initial={reduce ? false : slide}
            animate={rest}
            exit={reduce ? undefined : { ...slide, transition: { duration: 0.35, ease: EASE } }}
            transition={{ duration: 0.6, ease: EASE }}
            className={cn(
              "absolute flex flex-col overflow-y-auto overscroll-contain border-rule bg-ink text-milk",
              desktop
                ? "inset-y-0 right-0 w-[480px] border-l"
                : "inset-x-0 bottom-0 top-0 border-t pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
            )}
          >
            <div className="flex h-(--header-h) shrink-0 items-center justify-between border-b border-rule pl-gutter lg:pl-8">
              <h2 id={`${uid}-title`} className="mono text-meta">[ написать ]</h2>
              <button type="button" onClick={close} aria-label="Закрыть" className="flex size-14 items-center justify-center text-milk transition-colors hover:text-signal">
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-8 px-gutter py-8 lg:px-8">
              <p className="disp text-h3">Проверить дату</p>

              {/* мессенджеры */}
              <div className="grid grid-cols-1 gap-px bg-rule border border-rule">
                <a href={waLink(text)} target="_blank" rel="noopener" data-autofocus className="mono flex h-14 items-center gap-3 bg-signal px-5 font-medium text-ink transition-colors hover:bg-milk">
                  <WhatsAppGlyph /> WhatsApp
                  <span className="ml-auto normal-case tracking-normal text-ink/70">быстрее всего</span>
                </a>
                <a href={tgLink(text)} target="_blank" rel="noopener" className="mono flex h-14 items-center gap-3 bg-ink px-5 transition-colors hover:text-signal">
                  <TelegramGlyph /> Telegram
                </a>
                <a href={igDmLink()} target="_blank" rel="noopener" className="mono flex h-14 items-center gap-3 bg-ink px-5 transition-colors hover:text-signal">
                  <InstagramGlyph /> Instagram
                  <span className="ml-auto text-meta">{settings.contacts.instagram}</span>
                </a>
              </div>

              {/* email + телефон */}
              <dl className="mono grid gap-3 border-t border-rule pt-5">
                <div className="flex min-h-11 items-center gap-3">
                  <dt className="text-meta">email</dt>
                  <dd className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="min-w-0 normal-case tracking-normal [overflow-wrap:anywhere]">{settings.contacts.email}</span>
                    <button type="button" onClick={copyEmail} className="ml-auto flex h-11 shrink-0 items-center gap-1.5 px-2 text-signal hover:text-milk" aria-live="polite">
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "скопировано" : "скопировать"}
                    </button>
                  </dd>
                </div>
                <div className="flex min-h-11 items-center gap-3">
                  <dt className="text-meta">тел</dt>
                  <dd><a href={telLink()} className="inline-flex min-h-11 items-center hover:text-signal">{settings.contacts.phoneDisplay}</a></dd>
                </div>
              </dl>

              {/* форма */}
              {status === "sent" ? (
                <div ref={statusRef} tabIndex={-1} className="border-t border-rule pt-6 outline-none" role="status">
                  <p className="disp text-h3 text-signal">Получила!</p>
                  <p className="mt-3 text-milk">Напишу сегодня.</p>
                </div>
              ) : status === "wa" && sent ? (
                <div ref={statusRef} tabIndex={-1} className="flex flex-col gap-4 border-t border-rule pt-6 outline-none" role="status">
                  <p className="disp text-h3">Осталось нажать «Отправить» в WhatsApp</p>
                  <p className="text-milk">
                    Текст заявки уже в чате. Если WhatsApp не открылся — нажмите кнопку ниже.
                  </p>
                  <Button href={leadWaLink(sent, text)} variant="signal" size="lg">
                    <WhatsAppGlyph /> Открыть WhatsApp
                  </Button>
                  <button
                    type="button"
                    onClick={() => { focusName.current = true; setStatus("idle"); }}
                    className="mono-sm flex h-11 items-center self-start text-meta transition-colors hover:text-signal"
                  >
                    [ изменить заявку ]
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="relative flex flex-col gap-5 border-t border-rule pt-6" aria-busy={status === "sending"}>
                  <p className="mono text-meta">или коротко здесь</p>

                  {/* honeypot: люди не видят и не табают, боты заполняют */}
                  <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
                    <label>Не заполняйте<input type="text" name="hp_note" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
                  </div>

                  <Field id={`${uid}-name`} label="имя">
                    <input ref={nameRef} id={`${uid}-name`} name="name" autoComplete="name" required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field id={`${uid}-contact`} label="телефон / ник">
                    <input id={`${uid}-contact`} name="contact" autoComplete="tel" inputMode="text" required maxLength={120} placeholder="+7 ··· или @ник" value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} className={inputCls} />
                  </Field>

                  <fieldset className="flex flex-col gap-2">
                    <legend className="mono text-meta mb-2">формат</legend>
                    <div className="flex flex-wrap gap-2">
                      {formats.map((f) => {
                        const on = format === f.slug;
                        return (
                          <button
                            key={f.slug}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setFormat(on ? "" : f.slug)}
                            className={cn(
                              "mono-sm h-11 border px-3 transition-colors",
                              on ? "border-signal bg-signal text-ink" : "border-meta/80 text-milk hover:border-milk",
                            )}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <Field id={`${uid}-when`} label="когда">
                    {/* с занятостью подсказываем точную дату: по «июль 2027» проверить нечего */}
                    <input
                      id={`${uid}-when`}
                      name="when"
                      maxLength={80}
                      placeholder={AVAILABILITY_ON ? "12 июля 2027" : "июль 2027"}
                      value={draft.when}
                      onChange={(e) => setDraft({ ...draft, when: e.target.value })}
                      aria-describedby={AVAILABILITY_ON ? `${uid}-when-status` : undefined}
                      className={inputCls}
                    />
                    {AVAILABILITY_ON && <DateStatus id={`${uid}-when-status`} value={draft.when} className="pt-2" />}
                  </Field>
                  <Field id={`${uid}-msg`} label="пару слов">
                    <textarea id={`${uid}-msg`} name="message" rows={3} maxLength={2000} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} className={cn(inputCls, "h-auto min-h-24 resize-y py-3")} />
                  </Field>

                  <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 appearance-none border border-meta checked:border-signal checked:bg-signal"
                    />
                    <span className="text-[14px] leading-snug text-meta">
                      Согласна(ен) на обработку персональных данных
                    </span>
                  </label>
                  <Link href="/privacy" target="_blank" rel="noopener" className="mono-sm -mt-3 inline-flex min-h-11 items-center self-start text-meta underline underline-offset-4 hover:text-milk">
                    как я их храню
                  </Link>

                  {status === "fail" && (
                    <div role="alert" className="flex flex-col gap-3 border border-signal p-4">
                      <p className="mono text-signal">Не отправилось — напишите в WhatsApp</p>
                      <a href={waLink(fallbackText)} target="_blank" rel="noopener" className="mono flex h-12 items-center justify-center gap-2 bg-signal text-ink font-medium hover:bg-milk">
                        <WhatsAppGlyph /> WhatsApp
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    aria-disabled={status === "sending" || undefined}
                    className="mono flex h-14 items-center justify-center border border-milk font-medium text-milk transition-colors hover:bg-milk hover:text-ink aria-disabled:cursor-wait aria-disabled:opacity-60"
                  >
                    {status === "sending" ? "Отправляю…" : "Отправить"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls = "h-12 w-full border-0 border-b border-meta/80 bg-transparent px-0 text-[17px] text-milk placeholder:text-meta focus:border-signal";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="mono text-meta">{label}</label>
      {children}
    </div>
  );
}
