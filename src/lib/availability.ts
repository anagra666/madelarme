import type { Settings } from "@/content/types";

/**
 * Занятость Маши (settings.availability): чистые функции без React и без часов внутри —
 * «сегодня» всегда приходит снаружи (todayIn(new Date()) в браузере), поэтому всё проверяемо node-скриптом.
 * Даты — строки «YYYY-MM-DD» по календарю Алматы. Арифметика — номерами дней в UTC,
 * так что часовой пояс машины (сборка, браузер в другой стране) на результат не влияет.
 */

export const AVAILABILITY_TZ = "Asia/Almaty";
/** список старше — не показываем: лучше промолчать, чем пообещать уже занятую дату */
export const FRESH_DAYS = 30;
/** дальше двух лет вперёд статус даты не выводим: так далеко занятость не ведётся */
export const MAX_AHEAD_DAYS = 731;

/** «2027-07-12» */
export type Ymd = string;

const DAY_MS = 86_400_000;
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

/** y, m (1–12), d → номер дня от 1970-01-01; NaN, если такого дня нет («2027-02-30») */
function dayNumber(y: number, m: number, d: number): number {
  if (y < 1000 || y > 9999) return NaN;
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? t / DAY_MS : NaN;
}

function toDay(s: string): number {
  const m = YMD.exec(s);
  return m ? dayNumber(+m[1], +m[2], +m[3]) : NaN;
}

function fromDay(n: number): Ymd {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/** 0 — воскресенье … 6 — суббота (1970-01-01 был четвергом) */
function weekdayOf(n: number): number {
  return (((n + 4) % 7) + 7) % 7;
}

export function isYmd(s: unknown): s is Ymd {
  return typeof s === "string" && Number.isFinite(toDay(s));
}

/** Сколько дней от from до to (to − from); NaN, если одна из строк не дата */
export function daysBetween(from: Ymd, to: Ymd): number {
  return toDay(to) - toDay(from);
}

/** Сегодняшняя дата по календарю Алматы: в 23:30 по Москве там уже завтра */
export function todayIn(now: Date, timeZone = AVAILABILITY_TZ): Ymd {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Список обновлялся не раньше maxDays дней назад. Дата из будущего или с опечаткой — не свежий. */
export function isFresh(updated: string, today: Ymd, maxDays = FRESH_DAYS): boolean {
  const age = daysBetween(updated, today);
  return age >= 0 && age <= maxDays;
}

export function isBusy(date: Ymd, busy: readonly string[]): boolean {
  return busy.some((b) => b.trim() === date);
}

/** n ближайших суббот строго после from (сегодняшнюю субботу уже не предлагаем), которых нет в busy */
export function nextFreeSaturdays(n: number, from: Ymd, busy: readonly string[]): Ymd[] {
  const start = toDay(from);
  if (!Number.isFinite(start) || n <= 0) return [];
  const taken = new Set(busy.map((b) => b.trim()));
  const out: Ymd[] = [];
  for (let d = start + (((6 - weekdayOf(start)) + 6) % 7) + 1; out.length < n && d - start <= MAX_AHEAD_DAYS; d += 7) {
    const ymd = fromDay(d);
    if (!taken.has(ymd)) out.push(ymd);
  }
  return out;
}

/* ── дата из свободного текста поля «Когда» ───────────────────────────── */

const MONTHS = ["янв", "фев", "мар", "апр", "ма", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
/* слева от числа — не цифра, не точка/слэш и не тире: «12–13 июля» (диапазон) не превращается в одну дату */
const EDGE = String.raw`(?:^|[^\d./\-–—])`;
/* то же и не минуты «14:00»: двоеточие после буквы («дата:12 июля») — можно, после цифры — это время */
const EDGE_T = String.raw`(?:^|[^\d./:\-–—]|\D:)`;
const MONTH_RE = "(янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек)";
const RE_WORDS = new RegExp(
  EDGE + String.raw`(\d{1,2})(?:\s*-?\s*(?:го|е|ое))?\s*` + MONTH_RE + String.raw`[а-я]*\.?(?:\s*(\d{4})(?!\d))?`,
  "g",
);
const RE_DOTS = new RegExp(EDGE + String.raw`(\d{1,2})[./](\d{1,2})(?:[./](\d{4}|\d{2}))?(?!\d|[./]\d)`, "g");
const RE_ISO = new RegExp(EDGE + String.raw`(\d{4})-(\d{2})-(\d{2})(?!\d)`, "g");

/* кусочки для диапазонов и списков */
/* « часа», «ч» после числа — длительность («1.5 часа», «2.5ч»), а не дата */
const HOURS = String.raw`\s*ч(?:ас|(?![а-я]))`;
/* день 1–31, можно «-го»/«-е»: не «14» из «14:00», не кусок «100» и не «50» из «гостей 50» */
const DAY = String.raw`(?:0?[1-9]|[12]\d|3[01])(?![\d:])(?:\s?-?\s?(?:го|ое|е)(?![а-я]))?`;
/* «.07», «.07.2027», «/07/27» — месяц 1–12, иначе это время «18.30» */
const DOT_MONTH = String.raw`[./](?:0?[1-9]|1[0-2])(?!\d)(?:[./]\d{2,4})?(?!${HOURS})`;
/* « июля», « июля 2027», « июля 2027 г.» */
const WORD_MONTH = String.raw`\s*` + MONTH_RE + String.raw`[а-я]*\.?(?:\s*\d{4}(?:\s*г[а-я]*\.?)?)?`;
/* день с месяцем: «12 июля», «12.07», «2027-07-12» */
const DATED = String.raw`(?:\d{4}-\d{2}-\d{2}|${DAY}(?:${DOT_MONTH}|${WORD_MONTH}))`;
/* голый день в конце диапазона: «12 июля – 14». «– 14.00», «до 18 часов», «– 1.5 часа», «– 30 гостей» — не день */
const BARE_END = String.raw`${DAY}(?![./]\d\d)(?!(?:[./]\d)?\s?-?\s?[а-яa-z])`;
const SEP = String.raw`(?:\s*[-–—]\s*|\s(?:по|до)\s)`;

/*
 * «12–14 июля», «с 12 по 14 июля», «12.07–14.07», «12 июля – 14»: съемка на несколько дней —
 * статус одной даты тут врет («свободна», а второй день занят). Хотя бы у одного края должен быть месяц:
 * две голых цифры («с 14 до 18», «14-18») — это часы. Исключение — «с 12 по 14»: так про часы не пишут.
 */
const RE_RANGE = new RegExp(
  EDGE_T + String.raw`(?:${DATED}${SEP}(?:${DATED}|${BARE_END})|${DAY}${SEP}${DATED}|${DAY}\sпо\s${BARE_END})`,
);
/* «12 или 19 июля», «12, 13 июля» — несколько дней на один месяц: не угадываем, какой проверять */
const RE_DAY_LIST = new RegExp(EDGE_T + DAY + String.raw`\s*(?:,|\sи|\sили)\s*` + DAY + String.raw`\s*` + MONTH_RE);
/* «в 19.05», «1.5 часа», «2.5ч» — время и длительность, а не «19 мая» */
const RE_AT_BEFORE = /(?:^|[^а-я])в ?$/;
const RE_HOURS_AFTER = new RegExp("^" + HOURS);

/** Год не указан — ближайший такой день, начиная с сегодня */
function resolve(y: number | undefined, m: number, d: number, today: number, thisYear: number): number {
  if (y !== undefined) return dayNumber(y, m, d);
  const cur = dayNumber(thisYear, m, d);
  return cur >= today ? cur : dayNumber(thisYear + 1, m, d);
}

/**
 * «12 июля 2027», «12 июля», «1-го мая», «12.07.2027», «12.07.27», «12.07», «2027-07-12» → Ymd.
 * null — если в тексте нет даты, их несколько («12 или 19 июля»), это диапазон («12–14 июля»),
 * дата прошла, дальше двух лет или год ещё допечатывают («12 июля 20»). «июль 2027» и «ещё думаем» —
 * не дата, статуса нет. Время рядом с датой («в 14:00», «в 18.30», «с 14 до 18») не мешает.
 */
export function parseDateText(text: string, today: Ymd): Ymd | null {
  const t0 = toDay(today);
  if (!Number.isFinite(t0)) return null;
  const thisYear = +today.slice(0, 4);
  const s = text.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
  if (RE_RANGE.test(s) || RE_DAY_LIST.test(s)) return null;
  const found = new Set<number>();

  for (const m of s.matchAll(RE_WORDS)) {
    const rest = s.slice((m.index ?? 0) + m[0].length);
    if (!m[3] && /^\s*\d{1,3}$/.test(rest)) return null; // «12 июля 20» — год ещё печатают
    const month = MONTHS.findIndex((p) => m[2].startsWith(p)) + 1;
    found.add(resolve(m[3] ? +m[3] : undefined, month, +m[1], t0, thisYear));
  }
  for (const m of s.matchAll(RE_DOTS)) {
    const d = +m[1];
    const mo = +m[2];
    if (!m[3]) {
      // без года «18.30», «в 19.05», «1.5 часа» — время или длительность, а не дата
      const start = (m.index ?? 0) + m[0].indexOf(m[1]);
      const end = (m.index ?? 0) + m[0].length;
      if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
      if (RE_AT_BEFORE.test(s.slice(0, start)) || RE_HOURS_AFTER.test(s.slice(end))) continue;
    }
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : undefined;
    found.add(resolve(y, mo, d, t0, thisYear));
  }
  for (const m of s.matchAll(RE_ISO)) found.add(dayNumber(+m[1], +m[2], +m[3]));

  const days = [...found].filter(Number.isFinite);
  if (days.length !== 1) return null;
  const ahead = days[0] - t0;
  return ahead >= 0 && ahead <= MAX_AHEAD_DAYS ? fromDay(days[0]) : null;
}

/* ── настройки → что можно показывать ─────────────────────────────────── */

type AvailabilitySettings = Pick<Settings, "toggles" | "availability">;

/** Тумблер включён и список есть. Без учёта даты — одинаково на сервере и в браузере (для разметки без рассинхрона). */
export function availabilityEnabled(s: AvailabilitySettings): boolean {
  return Boolean(s.toggles.showAvailability && s.availability && isYmd(s.availability.updated));
}

/** Занятые дни, если их можно показывать сегодня (тумблер + свежесть). null — молчим. Кривые строки отбрасываются. */
export function activeBusy(s: AvailabilitySettings, today: Ymd): Ymd[] | null {
  if (!availabilityEnabled(s) || !s.availability || !isFresh(s.availability.updated, today)) return null;
  return s.availability.busy.map((b) => b.trim()).filter(isYmd);
}

export interface DateCheck {
  date: Ymd;
  busy: boolean;
}

/** Статус для поля «Когда»: null — занятость выключена/устарела или в тексте нет одной конкретной даты */
export function checkDateText(text: string, s: AvailabilitySettings, today: Ymd): DateCheck | null {
  const busy = activeBusy(s, today);
  if (!busy) return null;
  const date = parseDateText(text, today);
  return date ? { date, busy: isBusy(date, busy) } : null;
}

/* ── подписи ──────────────────────────────────────────────────────────── */

/* свои массивы, а не Intl: одинаковый текст в Node при сборке и в любом браузере */
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** «14 ноября», с year — «14 ноября 2026», с weekday — «сб, 14 ноября 2026» */
export function formatDay(ymd: Ymd, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const n = toDay(ymd);
  if (!Number.isFinite(n)) return ymd;
  const [y, m, d] = ymd.split("-").map(Number);
  const body = `${d} ${MONTHS_GEN[m - 1]}${opts.year ? ` ${y}` : ""}`;
  return opts.weekday ? `${WEEKDAYS[weekdayOf(n)]}, ${body}` : body;
}
