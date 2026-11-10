#!/usr/bin/env node
/**
 * Медиа-пайплайн: лупы, постеры и кадры из реальных фильмов Марии.
 *
 * Источники — сами фильмы с YouTube-канала Madelarme. Каждый один раз скачивается по id
 * в .cache/sources/{youtubeId}.mp4 (папка в .gitignore, в сборку не попадает) и дальше режется локально:
 * src / srcV без http(s) — путь от корня проекта, файл обязан существовать. Поле `youtube` у элемента —
 * откуда взят источник (чтобы скачать заново), кодированию оно не нужно. Сток остаётся только у элементов,
 * ещё помеченных полем `stock` («Pexels», «Unsplash»…): их src — прямая mp4/jpg ссылка Pexels / Mixkit / Coverr /
 * Unsplash (лицензии позволяют коммерческое использование без атрибуции), скачанное кэшируется в .cache/media.
 * http-источник без пометки stock собирается, но с предупреждением.
 *
 *   pnpm media            — собрать всё из scripts/media.manifest.json (пропускает готовое)
 *   pnpm media --force    — пересобрать
 *   pnpm media --only oyu-fest,n-n
 *   pnpm media --manifest /tmp/m.json --out /tmp/media
 *                         — другой манифест и папка вывода вместо public/media (пути от cwd): пробы, не трогая сайт
 *
 * Для каждого элемента манифеста (пути — внутри public/media или --out):
 *   kind "loop"    → loops/{name}-h.mp4 (1280×720, H.264, без звука, ≤ ~4 МБ)
 *                    loops/{name}-v.mp4 (720×1280; из srcV или кроп из src — та же сцена)
 *                    posters/{name}-h.webp, -v.webp, -45.webp
 *   kind "vloop"   → только вертикальный луп + постер (Reels); источник srcV (или src)
 *   kind "montage" → loops/{name}-h.mp4 и -v.mp4, склеенные подряд из segments: [{ src, start, end, cropXV?, cropY?,
 *                    precrop? }] (шоурил из нескольких фильмов), + posters/{name}-h, -v, -45.webp;
 *                    posterAt / posterAtV — время внутри монтажа. Кодирование как у loop
 *   kind "still"   → stills/{name}.webp + опц. -45.webp (also45, 864×1080); src может быть видео — тогда кадр на `at`.
 *                    w и h вместе — точный кроп под любой аспект (1600×900, 1440×1080…) с cropX / cropY,
 *                    размеры чётные (1067 выйдет как 1066 — и разойдётся с w/h в контенте, см. pnpm content:check);
 *                    одно из них — масштаб с сохранением пропорций; ни одного — 1600 по ширине, но не больше исходника
 *
 * Время (start, end, startV, endV, at, posterAt, posterAtV): секунды числом или «m:ss(.f)» / «h:mm:ss(.f)».
 * Отрезок — start + end или start + duration (по умолчанию 8 с); у V свои startV / endV / durationV, иначе как у H.
 * Постер — кадр start + min(1 с, полотрезка); posterAt / posterAtV (абсолютное время источника) — свой кадр.
 * posterAtV по умолчанию = posterAt, если V режется из того же источника и с того же места.
 *
 * Необязательные поля элемента: crf / crfV (качество H / V), maxrate / maxrateV («2500k», «2.5M» — потолок
 * битрейта для тяжёлых сцен, bufsize вдвое больше), fps (по умолчанию 30; реальным фильмам — родные 24 или 30),
 * cropXV (0…1, где по горизонтали резать 9:16 из 16:9; 0.5 = центр; posterCropXV — своё место для постера V), cropY (0…1, где по вертикали резать 16:9 из
 * более высокого кадра, например 4:3 1440×1080; H-луп и постеры), precrop («w:h:x:y» в пикселях — кроп исходника
 * до вписывания, например срезать вшитые полосы; для отдельного srcV — precropV).
 *
 * Упавший элемент не останавливает остальные, но в конце процесс выходит с кодом 1.
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir, stat, writeFile, readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ffmpeg = require("ffmpeg-static");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/media");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
function flag(name) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  if (!args[i + 1] || args[i + 1].startsWith("--")) {
    console.error(`${name}: нужно значение`);
    process.exit(1);
  }
  return args[i + 1];
}
const ONLY = flag("--only") ? new Set(flag("--only").split(",")) : null;
const MANIFEST = path.resolve(flag("--manifest") ?? path.join(__dirname, "media.manifest.json"));
const MEDIA = path.resolve(flag("--out") ?? path.join(ROOT, "public/media"));
const OUT = {
  loops: path.join(MEDIA, "loops"),
  posters: path.join(MEDIA, "posters"),
  stills: path.join(MEDIA, "stills"),
};

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function download(url) {
  await mkdir(CACHE, { recursive: true });
  const ext = (new URL(url).pathname.match(/\.(mp4|mov|webm|jpe?g|png|webp)$/i)?.[1] ?? "bin").toLowerCase();
  const key = Buffer.from(url).toString("base64url").slice(0, 80);
  const file = path.join(CACHE, `${key}.${ext}`);
  if (await exists(file)) return file;
  process.stdout.write(`  ↓ ${url}\n`);
  const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download failed ${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  return file;
}

/** http(s) — сток, качаем в кэш; иначе локальный файл от корня проекта (обычно .cache/sources/{youtubeId}.mp4) */
async function source(ref, item) {
  if (!ref) throw new Error("нет src");
  if (/^https?:\/\//i.test(ref)) {
    if (!item.stock) console.warn(`  ⚠ http-источник без пометки stock: ${ref}`);
    return download(ref);
  }
  const file = path.resolve(ROOT, ref);
  if (await exists(file)) return file;
  const hint = item.youtube ? ` — скачайте фильм youtube ${item.youtube} в .cache/sources/${item.youtube}.mp4` : "";
  throw new Error(`нет файла источника ${file}${hint}`);
}

/** секунды из числа или строки «ss(.f)» / «m:ss(.f)» / «h:mm:ss(.f)» */
function secs(t, label) {
  if (t == null) return undefined;
  if (typeof t === "number" && Number.isFinite(t) && t >= 0) return t;
  const m = String(t).trim().match(/^(?:(?:(\d+):)?(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m || (m[2] != null && Number(m[3]) >= 60) || (m[1] != null && Number(m[2]) >= 60)) {
    throw new Error(`${label}: «${t}» — нужны секунды, «m:ss.f» или «h:mm:ss.f»`);
  }
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3]);
}

/** длина отрезка от start: end − start или duration (оба сразу — ошибка); v = "V" — поля endV / durationV */
function span(o, start, fallback, v = "") {
  const end = o[`end${v}`];
  const duration = o[`duration${v}`];
  if (end != null && duration != null) throw new Error(`end${v} и duration${v} одновременно — оставьте одно`);
  const d = end != null ? secs(end, `end${v}`) - start : (secs(duration, `duration${v}`) ?? fallback);
  if (d == null) throw new Error(`нет end${v} / duration${v}`);
  if (!(d > 0)) throw new Error(`end${v} не позже start${v}: длина ${+d.toFixed(3)} с`);
  return d;
}

/** доля 0…1 для кропа (cropXV, cropY, cropX) */
function frac(v, label) {
  if (v == null) return 0.5;
  if (typeof v !== "number" || !(v >= 0 && v <= 1)) throw new Error(`${label}: ${v} — нужна доля 0…1`);
  return v;
}

function precropOf(v, label) {
  if (v == null) return undefined;
  if (!/^\d+:\d+:\d+:\d+$/.test(v)) throw new Error(`${label}: «${v}» — нужно «w:h:x:y» в пикселях`);
  return v;
}

function fpsOf(v) {
  if (v == null) return 30;
  if (typeof v !== "number" || !(v > 0 && v <= 60)) throw new Error(`fps: ${v} — нужно число до 60 (24, 25, 30)`);
  return v;
}

/** «2500k» / «2500K» / «2.5M» / 2500000 (бит/с) → кбит/с */
function kbps(v) {
  const m = String(v).trim().match(/^(\d+(?:\.\d+)?)([kKmM]?)$/);
  const kb = m ? Math.round(Number(m[1]) * ({ k: 1, m: 1000 }[m[2].toLowerCase()] ?? 0.001)) : 0;
  if (!(kb >= 1)) throw new Error(`maxrate «${v}» — нужно «2500k» или «2.5M»`);
  return kb;
}

function run(argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: ["ignore", "inherit", "inherit"] });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${argv.join(" ")}`))));
  });
}

const pre = (precrop) => (precrop ? `crop=${precrop},` : "");
// [precrop →] scale to cover + crop to exact WxH (x / y: 0…1 доля свободного поля, 0.5 = центр)
const fit = (w, h, { x = 0.5, y = 0.5, precrop } = {}) =>
  `${pre(precrop)}scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:(iw-${w})*${x}:(ih-${h})*${y}`;
// то же + fps для лупов (по умолчанию 30); setsar=1 — иначе кроп 9:16 из 16:9 даёт SAR 4095:4096
const cover = (w, h, crop, fps = 30) => `${fit(w, h, crop)},setsar=1,fps=${fps}`;

/** общие настройки H.264 для лупов и монтажа; ключевой кадр раз в 2 с */
function x264(crf, maxrate, fps) {
  const kb = maxrate != null ? kbps(maxrate) : null;
  const cap = kb ? ["-maxrate", `${kb}k`, "-bufsize", `${kb * 2}k`] : [];
  return [
    "-an", "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), ...cap, "-profile:v", "high", "-level", "4.0",
    "-pix_fmt", "yuv420p", "-g", String(Math.round(fps * 2)), "-movflags", "+faststart",
  ];
}

async function encodeLoop(src, out, w, h, start, duration, crf, { maxrate, fps = 30, crop } = {}) {
  if (!FORCE && (await exists(out))) return;
  await run([
    "-ss", String(start), "-t", String(duration), "-i", src,
    "-vf", cover(w, h, crop, fps), ...x264(crf, maxrate, fps),
    out,
  ]);
}

/** монтаж: каждый отрезок обрезается, вписывается в WxH (H — cropY, V — cropXV отрезка) и склеивается concat, без звука */
async function encodeMontage(segs, out, w, h, crf, { maxrate, fps, v }) {
  if (!FORCE && (await exists(out))) return;
  const inputs = segs.flatMap((s) => ["-ss", String(s.start), "-t", String(s.dur), "-i", s.file]);
  const parts = segs.map((s, i) => `[${i}:v]setpts=PTS-STARTPTS,${cover(w, h, v ? s.cropV : s.cropH, fps)}[s${i}]`);
  const graph = `${parts.join(";")};${segs.map((_, i) => `[s${i}]`).join("")}concat=n=${segs.length}:v=1:a=0[out]`;
  await run([...inputs, "-filter_complex", graph, "-map", "[out]", ...x264(crf, maxrate, fps), out]);
}

/** время внутри монтажа → отрезок и время в его источнике */
function frameAt(segs, t, label) {
  let from = 0;
  for (const s of segs) {
    if (t < from + s.dur) return { s, t: s.start + (t - from) };
    from += s.dur;
  }
  throw new Error(`${label} ${t} с — за концом монтажа (${+from.toFixed(3)} с)`);
}

async function poster(src, out, w, h, at, crop) {
  if (!FORCE && (await exists(out))) return;
  await run(["-ss", String(at), "-i", src, "-frames:v", "1", "-vf", fit(w, h, crop), "-c:v", "libwebp", "-quality", "78", out]);
}

// w и h вместе — точный кроп; одно — масштаб с сохранением пропорций; ни одного — 1600 по ширине без апскейла
async function still(src, out, { w, h, at, ...crop }) {
  if (!FORCE && (await exists(out))) return;
  const vf = w && h ? fit(w, h, crop) : pre(crop.precrop) + (w || h ? `scale=${w ?? -2}:${h ?? -2}` : "scale='min(1600,iw)':-2");
  const seek = at != null ? ["-ss", String(at)] : [];
  await run([...seek, "-i", src, "-frames:v", "1", "-vf", vf, "-c:v", "libwebp", "-quality", "80", out]);
}

async function sizeKB(p) {
  return Math.round((await stat(p)).size / 1024);
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  await Promise.all(Object.values(OUT).map((d) => mkdir(d, { recursive: true })));
  const report = [];
  const loopOut = (name, v) => path.join(OUT.loops, `${name}-${v}.mp4`);
  const posterOut = (name, v) => path.join(OUT.posters, `${name}-${v}.webp`);
  const unknown = ONLY ? [...ONLY].filter((n) => !manifest.items.some((i) => i.name === n)) : [];
  if (unknown.length) console.error(`✗ --only: нет в манифесте ${unknown.join(", ")}`);

  for (const item of manifest.items) {
    if (ONLY && !ONLY.has(item.name)) continue;
    const { name, kind } = item;
    process.stdout.write(`▸ ${kind} ${name}\n`);
    try {
      if (kind === "loop" || kind === "vloop") {
        const fps = fpsOf(item.fps);
        const start = secs(item.start, "start") ?? 0;
        const dur = span(item, start, 8);
        const startV = secs(item.startV, "startV") ?? start;
        const durV = span(item, startV, dur, "V");
        const at = secs(item.posterAt, "posterAt");
        // V из того же файла: vloop или loop без srcV — тогда precrop и posterAt (при том же start) общие с H
        const sameSrc = kind === "vloop" || !item.srcV;
        const atV = secs(item.posterAtV, "posterAtV") ?? (sameSrc && item.startV == null ? at : undefined) ?? startV + Math.min(1, durV / 2);
        const cropH = { y: frac(item.cropY, "cropY"), precrop: precropOf(item.precrop, "precrop") };
        const cropV = { x: frac(item.cropXV, "cropXV"), precrop: precropOf(item.precropV ?? (sameSrc ? item.precrop : undefined), "precropV") };
        if (kind === "loop") {
          const src = await source(item.src, item);
          const outH = loopOut(name, "h");
          const atH = at ?? start + Math.min(1, dur / 2);
          await encodeLoop(src, outH, 1280, 720, start, dur, item.crf ?? 26, { maxrate: item.maxrate, fps, crop: cropH });
          await poster(src, posterOut(name, "h"), 1280, 720, atH, cropH);
          if (item.poster45 !== false) await poster(src, posterOut(name, "45"), 864, 1080, atH, cropH);
          report.push({ name, file: `loops/${name}-h.mp4`, kb: await sizeKB(outH) });
        }
        const srcV = await source(item.srcV ?? item.src, item);
        const outV = loopOut(name, "v");
        await encodeLoop(srcV, outV, 720, 1280, startV, durV, item.crfV ?? 27, { maxrate: item.maxrateV, fps, crop: cropV });
        // постер V может стоять в другом месте кадра, чем сам луп: posterCropXV
        const cropPV = item.posterCropXV != null ? { ...cropV, x: frac(item.posterCropXV, "posterCropXV") } : cropV;
        await poster(srcV, posterOut(name, "v"), 720, 1280, atV, cropPV);
        report.push({ name, file: `loops/${name}-v.mp4`, kb: await sizeKB(outV) });
      } else if (kind === "montage") {
        const fps = fpsOf(item.fps);
        if (!item.segments?.length) throw new Error("montage без segments");
        const segs = [];
        for (const [i, s] of item.segments.entries()) {
          try {
            const start = secs(s.start, "start") ?? 0;
            const precrop = precropOf(s.precrop, "precrop");
            segs.push({
              file: await source(s.src, s),
              start,
              dur: span(s, start),
              cropH: { y: frac(s.cropY, "cropY"), precrop },
              cropV: { x: frac(s.cropXV, "cropXV"), precrop },
            });
          } catch (e) {
            throw new Error(`segments[${i}]: ${e.message}`);
          }
        }
        const total = segs.reduce((n, s) => n + s.dur, 0);
        const at = secs(item.posterAt, "posterAt") ?? Math.min(1, total / 2);
        const pH = frameAt(segs, at, "posterAt");
        const pV = frameAt(segs, secs(item.posterAtV, "posterAtV") ?? at, "posterAtV");
        const outH = loopOut(name, "h");
        const outV = loopOut(name, "v");
        await encodeMontage(segs, outH, 1280, 720, item.crf ?? 26, { maxrate: item.maxrate, fps, v: false });
        await poster(pH.s.file, posterOut(name, "h"), 1280, 720, pH.t, pH.s.cropH);
        if (item.poster45 !== false) await poster(pH.s.file, posterOut(name, "45"), 864, 1080, pH.t, pH.s.cropH);
        report.push({ name, file: `loops/${name}-h.mp4`, kb: await sizeKB(outH) });
        await encodeMontage(segs, outV, 720, 1280, item.crfV ?? 27, { maxrate: item.maxrateV, fps, v: true });
        await poster(pV.s.file, posterOut(name, "v"), 720, 1280, pV.t, pV.s.cropV);
        report.push({ name, file: `loops/${name}-v.mp4`, kb: await sizeKB(outV) });
      } else if (kind === "still") {
        const src = await source(item.src, item);
        const out = path.join(OUT.stills, `${name}.webp`);
        const opts = { at: secs(item.at, "at"), x: frac(item.cropX, "cropX"), y: frac(item.cropY, "cropY"), precrop: precropOf(item.precrop, "precrop") };
        await still(src, out, { ...opts, w: item.w, h: item.h });
        if (item.also45) await still(src, path.join(OUT.stills, `${name}-45.webp`), { ...opts, w: 864, h: 1080 });
        report.push({ name, file: `stills/${name}.webp`, kb: await sizeKB(out) });
      } else {
        throw new Error(`unknown kind ${kind}`);
      }
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
      report.push({ name, error: e.message });
    }
  }

  const over = report.filter((r) => r.kb && ((r.file.endsWith("-h.mp4") && r.kb > 4200) || (r.file.endsWith("-v.mp4") && r.kb > 3200)));
  // с --only дописываем в прежний отчёт, а не затираем его частичным
  const reportPath = path.join(MEDIA, "manifest.json");
  let full = report;
  if (ONLY && (await exists(reportPath))) {
    const prev = JSON.parse(await readFile(reportPath, "utf8")).report ?? [];
    full = [...prev.filter((r) => !ONLY.has(r.name)), ...report];
  }
  await writeFile(reportPath, JSON.stringify({ generated: new Date().toISOString(), report: full }, null, 2));
  const failed = report.filter((r) => r.error).length;
  console.log(`\n${report.filter((r) => !r.error).length} файлов готово, ${failed} ошибок`);
  if (over.length) console.log(`⚠ превышают бюджет (H ≤4 МБ, V ≤3 МБ): ${over.map((r) => `${r.file} ${r.kb}KB`).join(", ")} — уменьшите duration или поднимите crf`);
  if (failed || unknown.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
