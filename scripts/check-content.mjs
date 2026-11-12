#!/usr/bin/env node
/**
 * Проверка контента против контракта src/content/types.ts — того, что не ловит tsc: JSON приводится
 * к типам через `as`, поэтому пропущенное обязательное поле всплывает только падением пререндера.
 *
 *   pnpm content:check    — отчёт, exit 1 если есть ошибки (✗); замечания (⚠) сборку не валят
 *
 * Кейсы: уникальные slug, обязательные поля, format / extraFormats есть в formats.json, mood из списка,
 * fullVideo.duration «MM:SS» или «H:MM:SS», uploadDate «YYYY-MM-DD», необязательные строки не пустые
 * (иначе в строке «клиент · город · год» висит « · »), title длиннее 14 символов — замечание.
 * Кадры (stills кейсов, about.portrait): числовые w/h и, если файл уже собран в public, реальный размер
 * из заголовка WebP / JPEG / PNG. reels / testimonials / clients: caseSlug ведёт на опубликованный кейс.
 * Форматы (slug, group, priceModel, fromPrice, deliverables, loop…), pricing (тарифы, extras, terms) и faq (scope):
 * опечатка в group / priceModel / tab молча убирает формат со страницы или цену, а без обязательного поля падает пререндер.
 * settings.showreel: файлы лупа существуют, film — как fullVideo. Наличие остальных /media — pnpm media:check.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "src/content");
const PUBLIC = path.join(ROOT, "public");

const load = async (name) => JSON.parse(await readFile(path.join(CONTENT, `${name}.json`), "utf8"));
const [cases, formats, reels, testimonials, clients, settings, pricing, faq] = await Promise.all(
  ["cases", "formats", "reels", "testimonials", "clients", "settings", "pricing", "faq"].map(load),
);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const MOODS = ["bold", "gentle", "documentary"];
const PROVIDERS = ["self", "bunny", "kinescope", "vimeo", "youtube"];
/* плеер встраивает только то, что разрешает CSP: FRAME_SRC в src/lib/security.ts и строка CSP в scripts/static.htaccess */
const PROVIDERS_IN_CSP = ["self", "youtube"];
const DURATION = /^(\d{2}:[0-5]\d|\d+:[0-5]\d:[0-5]\d)$/;
const TITLE_MAX = 14;

const get = (o, p) => p.split(".").reduce((v, k) => v?.[k], o);
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const isDate = (s) =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().startsWith(s);

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

/** размер картинки из заголовка: WebP (VP8 / VP8L / VP8X), PNG, JPEG (маркер SOFn); null — формат не распознан */
function imageSize(b) {
  if (b.length < 30) return null;
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const n = b.readUInt32LE(21);
      return { w: (n & 0x3fff) + 1, h: ((n >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    return null;
  }
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) { i += 2; continue; }
      // SOF0…SOF15, кроме DHT (C4), JPG (C8), DAC (CC)
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

async function realSize(src) {
  const file = path.join(PUBLIC, src);
  if (!src.startsWith("/") || !(await exists(file))) return undefined;
  return imageSize(await readFile(file));
}

function unique(list, key, where) {
  const seen = new Set();
  for (const x of list) {
    if (seen.has(x[key])) err(where, `${key} «${x[key]}» повторяется`);
    seen.add(x[key]);
  }
}

/** необязательные строки: если поле есть, оно не пустое — иначе в UI остаётся разделитель без значения */
function optionalStrings(o, paths, where) {
  for (const p of paths) {
    const v = get(o, p);
    if (v != null && !isStr(v)) err(where, `${p} пустой или не строка — уберите поле целиком`);
  }
}

async function checkStill(s, where) {
  if (!s || typeof s !== "object") return err(where, "не объект");
  if (!isStr(s.src)) err(where, "нет src");
  if (typeof s.alt !== "string") err(where, "нет alt");
  else if (!s.alt.trim()) warn(where, "пустой alt");
  optionalStrings(s, ["caption"], where);
  if (!(Number.isInteger(s.w) && s.w > 0 && Number.isInteger(s.h) && s.h > 0)) {
    return err(where, `w/h должны быть целыми числами в пикселях (сейчас ${s.w}×${s.h})`);
  }
  if (!isStr(s.src)) return;
  const size = await realSize(s.src);
  if (size === undefined) return warn(where, `${s.src} ещё не собран — размер не сверить`);
  if (!size) return warn(where, `${s.src}: не удалось прочитать размер (не WebP / JPEG / PNG?)`);
  if (size.w !== s.w || size.h !== s.h) err(where, `${s.src} на деле ${size.w}×${size.h}, а в контенте ${s.w}×${s.h}`);
}

async function checkVideo(v, where) {
  if (!v || typeof v !== "object") return err(where, "не объект");
  if (!PROVIDERS.includes(v.provider)) err(where, `provider «${v.provider}» — нужен один из ${PROVIDERS.join(" / ")}`);
  else if (!PROVIDERS_IN_CSP.includes(v.provider)) err(where, `provider «${v.provider}» заблокирует CSP: добавьте его домен в FRAME_SRC (src/lib/security.ts) и в scripts/static.htaccess, затем в PROVIDERS_IN_CSP здесь`);
  if (!isStr(v.id)) err(where, "нет id");
  else if (v.provider === "youtube" && !/^[\w-]{11}$/.test(v.id)) err(where, `id «${v.id}» не похож на YouTube id (11 символов)`);
  else if (v.provider === "self" && !(await exists(path.join(PUBLIC, v.id)))) err(where, `нет файла public${v.id}`);
  if (typeof v.duration !== "string" || !DURATION.test(v.duration)) err(where, `duration «${v.duration}» — нужно «MM:SS» или «H:MM:SS»`);
  if (v.uploadDate != null && !isDate(v.uploadDate)) err(where, `uploadDate «${v.uploadDate}» — нужно «YYYY-MM-DD»`);
}

/** MediaLoop: mp4H и posterH обязательны; files — все файлы лупа есть в public; og — posterH идёт в og:image */
async function checkLoop(loop, where, { files = false, og = false } = {}) {
  if (!loop || typeof loop !== "object") return err(where, "нет loop");
  for (const k of ["mp4H", "posterH"]) if (!isStr(loop[k])) err(where, `нет ${k}`);
  optionalStrings(loop, ["mp4V", "posterV", "poster45"], where);
  if (files) {
    for (const k of ["mp4H", "mp4V", "posterH", "posterV", "poster45"]) {
      if (isStr(loop[k]) && !(await exists(path.join(PUBLIC, loop[k])))) err(where, `${k}: нет файла public${loop[k]}`);
    }
  }
  // og:image объявлен 1280×720 (layout.tsx, work/[slug], formats/[slug])
  if (og && isStr(loop.posterH)) {
    const size = await realSize(loop.posterH);
    if (size && (size.w !== 1280 || size.h !== 720)) warn(where, `posterH ${size.w}×${size.h}, а og:image объявлен 1280×720`);
  }
}

// ── кейсы ─────────────────────────────────────────────────────────────────────

const formatBySlug = new Map(formats.map((f) => [f.slug, f]));
unique(formats, "slug", "formats");
unique(cases, "slug", "cases");
unique(reels, "slug", "reels");

for (const [i, c] of cases.entries()) {
  const where = `cases[${isStr(c.slug) ? c.slug : i}]`;
  for (const k of ["slug", "title", "logline", "client", "format", "task", "approach"]) if (!isStr(c[k])) err(where, `нет ${k}`);
  if (isStr(c.slug) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) err(where, "slug — только латиница, цифры и дефисы");
  for (const k of ["isPlaceholder", "isPublished", "featured"]) if (typeof c[k] !== "boolean") err(where, `${k} должен быть true / false`);
  if (!Number.isFinite(c.sortOrder)) err(where, "нет sortOrder");
  if (isStr(c.title) && [...c.title].length > TITLE_MAX) {
    warn(where, `title «${c.title}» — ${[...c.title].length} символов, больше ${TITLE_MAX}: в одну строку не встанет`);
  }

  if (!Array.isArray(c.mood)) err(where, "нет mood");
  else {
    for (const m of c.mood) if (!MOODS.includes(m)) err(where, `mood «${m}» — нужен один из ${MOODS.join(" / ")}`);
    if (!c.mood.length) warn(where, "mood пуст — кейс не попадёт ни в один фильтр настроения");
  }

  if (isStr(c.format)) {
    if (!formatBySlug.has(c.format)) err(where, `format «${c.format}» нет в formats.json`);
    else if (!formatBySlug.get(c.format).isPublished) warn(where, `format «${c.format}» не опубликован`);
  }
  if (c.extraFormats != null) {
    if (!Array.isArray(c.extraFormats)) err(where, "extraFormats — не массив");
    else {
      for (const f of c.extraFormats) {
        if (!formatBySlug.has(f)) err(where, `extraFormats: «${f}» нет в formats.json`);
        else if (f === c.format) warn(where, `extraFormats: «${f}» повторяет format`);
      }
    }
  }

  await checkLoop(c.loop, `${where}.loop`, { og: true });
  if (c.fullVideo != null) await checkVideo(c.fullVideo, `${where}.fullVideo`);

  optionalStrings(c, ["clientGen", "city", "date", "shooting.operators", "post.delivery", "post.notes", "result.text", "featuredIn", "seo.title", "seo.description"], where);
  if (c.year != null && !(Number.isInteger(c.year) && c.year > 1990 && c.year < 2100)) err(where, `year «${c.year}» — нужен год числом`);
  if (c.venues != null) {
    if (!Array.isArray(c.venues) || c.venues.some((v) => !isStr(v))) err(where, "venues — массив непустых строк");
    else if (!c.venues.length) warn(where, "venues пуст — уберите поле");
  }

  if (!Array.isArray(c.deliverables)) err(where, "нет deliverables");
  else {
    if (!c.deliverables.length) warn(where, "deliverables пуст");
    c.deliverables.forEach((d, j) => {
      for (const k of ["name", "duration"]) if (!isStr(d?.[k])) err(`${where}.deliverables[${j}]`, `нет ${k}`);
      optionalStrings(d, ["aspect", "note"], `${where}.deliverables[${j}]`);
    });
  }
  if (c.credits != null) {
    if (!Array.isArray(c.credits)) err(where, "credits — не массив");
    else c.credits.forEach((cr, j) => {
      for (const k of ["role", "name"]) if (!isStr(cr?.[k])) err(`${where}.credits[${j}]`, `нет ${k}`);
    });
  }
  if (c.reels != null) {
    if (!Array.isArray(c.reels)) err(where, "reels — не массив");
    else for (const [j, r] of c.reels.entries()) await checkLoop(r, `${where}.reels[${j}]`);
  }
  if (c.stills != null) {
    if (!Array.isArray(c.stills)) err(where, "stills — не массив");
    else for (const [j, s] of c.stills.entries()) await checkStill(s, `${where}.stills[${j}]`);
  }
  if (c.testimonial != null) {
    for (const k of ["quote", "author"]) if (!isStr(c.testimonial[k])) err(`${where}.testimonial`, `нет ${k}`);
    if (typeof c.testimonial.confirmed !== "boolean") err(`${where}.testimonial`, "confirmed должен быть true / false");
  }
}

const sortOrders = cases.map((c) => c.sortOrder);
const dupOrder = sortOrders.filter((n, i) => sortOrders.indexOf(n) !== i);
if (dupOrder.length) warn("cases", `sortOrder повторяется: ${[...new Set(dupOrder)].join(", ")} — порядок не определён`);

// ── ссылки на кейсы ───────────────────────────────────────────────────────────

const caseBySlug = new Map(cases.map((c) => [c.slug, c]));
function checkCaseRef(slug, where) {
  if (slug == null) return;
  const c = caseBySlug.get(slug);
  if (!c) return err(where, `caseSlug «${slug}» — такого кейса нет`);
  if (!c.isPublished) return err(where, `caseSlug «${slug}» — кейс не опубликован`);
  if (c.isPlaceholder && !settings.toggles?.showPlaceholders) warn(where, `caseSlug «${slug}» — кейс-заглушка скрыт тумблером showPlaceholders`);
}

for (const [i, r] of reels.entries()) {
  const where = `reels[${isStr(r.slug) ? r.slug : i}]`;
  for (const k of ["slug", "title"]) if (!isStr(r[k])) err(where, `нет ${k}`);
  if (typeof r.isPlaceholder !== "boolean") err(where, "isPlaceholder должен быть true / false");
  optionalStrings(r, ["caption"], where);
  await checkLoop(r.loop, `${where}.loop`);
  if (r.full != null) await checkVideo(r.full, `${where}.full`);
  checkCaseRef(r.caseSlug, where);
}
for (const [i, t] of testimonials.entries()) {
  const where = `testimonials[${i}]`;
  for (const k of ["quote", "author"]) if (!isStr(t[k])) err(where, `нет ${k}`);
  if (typeof t.confirmed !== "boolean") err(where, "confirmed должен быть true / false");
  optionalStrings(t, ["role"], where);
  checkCaseRef(t.caseSlug, where);
}
for (const [i, cl] of clients.entries()) {
  const where = `clients[${isStr(cl.name) ? cl.name : i}]`;
  if (!isStr(cl.name)) err(where, "нет name");
  if (typeof cl.confirmed !== "boolean") err(where, "confirmed должен быть true / false");
  checkCaseRef(cl.caseSlug, where);
}

// ── форматы, тарифы, FAQ ─────────────────────────────────────────────────────

const GROUPS = ["wedding", "brand", "content"];
const PRICE_MODELS = ["time", "unit", "custom"];
const TABS = ["time", "unit"];
const FAQ_SCOPES = ["pricing", "wedding", "brand", "contact"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const strList = (v) => Array.isArray(v) && v.every(isStr);
const qaList = (v, where) => {
  if (!Array.isArray(v)) return err(where, "не массив");
  v.forEach((x, j) => { for (const k of ["q", "a"]) if (!isStr(x?.[k])) err(`${where}[${j}]`, `нет ${k}`); });
};

for (const [i, f] of formats.entries()) {
  const where = `formats[${isStr(f.slug) ? f.slug : i}]`;
  for (const k of ["slug", "name", "term", "duration", "intro"]) if (!isStr(f[k])) err(where, `нет ${k}`);
  if (isStr(f.slug) && !SLUG.test(f.slug)) err(where, "slug — только латиница, цифры и дефисы");
  if (!GROUPS.includes(f.group)) err(where, `group «${f.group}» — нужен один из ${GROUPS.join(" / ")} (иначе формат пропадёт со страницы /formats)`);
  if (f.priceModel != null && !PRICE_MODELS.includes(f.priceModel)) err(where, `priceModel «${f.priceModel}» — нужен один из ${PRICE_MODELS.join(" / ")}`);
  if (f.fromPrice != null && !isPosInt(f.fromPrice)) err(where, `fromPrice «${f.fromPrice}» — целое число ₸ без пробелов и кавычек`);
  if (typeof f.isPublished !== "boolean") err(where, "isPublished должен быть true / false");
  if (f.isAddon != null && typeof f.isAddon !== "boolean") err(where, "isAddon должен быть true / false");
  if (!Number.isFinite(f.sortOrder)) err(where, "нет sortOrder");
  if (!strList(f.deliverables)) err(where, "deliverables — массив непустых строк");
  else if (!f.deliverables.length) warn(where, "deliverables пуст");
  if (f.process != null && !strList(f.process)) err(where, "process — массив непустых строк");
  if (f.faq != null) qaList(f.faq, `${where}.faq`);
  optionalStrings(f, ["seoName", "turnaround"], where);
  if (f.lang != null && f.lang !== "kk") err(where, `lang «${f.lang}» — пока поддержан только "kk"`);
  if (f.loop != null) await checkLoop(f.loop, `${where}.loop`, { files: true, og: true });
}

if (!pricing || !Array.isArray(pricing.collections)) err("pricing", "нет collections");
else {
  unique(pricing.collections, "slug", "pricing.collections");
  for (const [i, c] of pricing.collections.entries()) {
    const where = `pricing.collections[${isStr(c.slug) ? c.slug : i}]`;
    for (const k of ["slug", "name"]) if (!isStr(c[k])) err(where, `нет ${k}`);
    if (isStr(c.slug) && !SLUG.test(c.slug)) err(where, "slug — только латиница, цифры и дефисы (это якорь /pricing#slug)");
    if (!TABS.includes(c.tab)) err(where, `tab «${c.tab}» — нужен один из ${TABS.join(" / ")}`);
    if (!isPosInt(c.fromPrice)) err(where, `fromPrice «${c.fromPrice}» — целое число ₸ без пробелов и кавычек`);
    if (!Number.isFinite(c.sortOrder)) err(where, "нет sortOrder");
    if (!Array.isArray(c.lines)) err(where, "нет lines");
    else c.lines.forEach((l, j) => { for (const k of ["k", "v"]) if (!isStr(l?.[k])) err(`${where}.lines[${j}]`, `нет ${k}`); });
    optionalStrings(c, ["unit", "badge", "note"], where);
  }
  // формат с моделью time / unit без своей fromPrice берёт цену из самого дешёвого тарифа своей вкладки
  for (const tab of TABS) {
    const needs = formats.filter((f) => f.isPublished && (f.priceModel ?? (f.isAddon && !f.fromPrice ? undefined : "time")) === tab && f.fromPrice == null);
    if (needs.length && !pricing.collections.some((c) => c.tab === tab)) {
      err("pricing", `нет тарифа с tab «${tab}», а он нужен форматам ${needs.map((f) => f.slug).join(", ")} — у них будет «индивидуально»`);
    }
  }
}
if (!Array.isArray(pricing?.extras)) err("pricing", "нет extras");
else pricing.extras.forEach((x, j) => {
  for (const k of ["name", "price"]) if (!isStr(x?.[k])) err(`pricing.extras[${j}]`, `нет ${k}`);
  optionalStrings(x, ["note"], `pricing.extras[${j}]`);
});
if (!strList(pricing?.terms)) err("pricing", "terms — массив непустых строк");

if (!Array.isArray(faq)) err("faq", "не массив");
else for (const [i, q] of faq.entries()) {
  const where = `faq[${i}]`;
  for (const k of ["q", "a"]) if (!isStr(q[k])) err(where, `нет ${k}`);
  if (!Array.isArray(q.scope) || !q.scope.length) err(where, "scope — непустой массив");
  else for (const s of q.scope) if (!FAQ_SCOPES.includes(s)) err(where, `scope «${s}» — нужен один из ${FAQ_SCOPES.join(" / ")}`);
}

// ── настройки ─────────────────────────────────────────────────────────────────

if (settings.showreel != null) {
  const { loop, film, ...rest } = settings.showreel;
  if (Object.keys(rest).length) {
    warn("settings.showreel", `лишние поля ${Object.keys(rest).join(", ")} — контракт { loop, film? }: полный фильм переносится в film`);
  }
  await checkLoop(loop, "settings.showreel.loop", { files: true, og: true });
  if (film != null) await checkVideo(film, "settings.showreel.film");
}
if (settings.about?.portrait != null) await checkStill(settings.about.portrait, "settings.about.portrait");

// ── отчёт ─────────────────────────────────────────────────────────────────────

const published = cases.filter((c) => c.isPublished).length;
console.log(`кейсов: ${cases.length} (опубликовано ${published}), форматов: ${formats.length}, reels: ${reels.length}, отзывов: ${testimonials.length}, клиентов: ${clients.length}`);
if (warnings.length) {
  console.log(`\n⚠ замечания (${warnings.length}):`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (errors.length) {
  console.error(`\n✗ ошибки (${errors.length}):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log("\n✓ контент сходится с контрактом");
