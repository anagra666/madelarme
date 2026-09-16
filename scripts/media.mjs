#!/usr/bin/env node
/**
 * Медиа-пайплайн демо-контента.
 *
 *   pnpm media            — собрать всё из scripts/media.manifest.json (пропускает готовое)
 *   pnpm media --force    — пересобрать
 *   pnpm media --only tau-toi,oyu-fest
 *
 * Для каждого элемента манифеста:
 *   kind "loop"  → public/media/loops/{name}-h.mp4 (1280×720, H.264, без звука, ≤ ~4 МБ)
 *                  public/media/loops/{name}-v.mp4 (720×1280; из srcV или центр-кроп из src)
 *                  public/media/posters/{name}-h.webp, -v.webp, -45.webp
 *   kind "vloop" → только вертикальный луп + постер (Reels)
 *   kind "still" → public/media/stills/{name}.webp (ширина 1600) + опц. -45.webp
 *
 * Источники — прямые mp4/jpg ссылки Pexels / Mixkit / Coverr (лицензии позволяют коммерческое
 * использование без атрибуции). Скачанное кэшируется в .cache/media.
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir, stat, writeFile, readFile } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ffmpeg = require("ffmpeg-static");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/media");
const OUT = {
  loops: path.join(ROOT, "public/media/loops"),
  posters: path.join(ROOT, "public/media/posters"),
  stills: path.join(ROOT, "public/media/stills"),
};

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",")) : null;

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

function run(argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: ["ignore", "inherit", "inherit"] });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${argv.join(" ")}`))));
  });
}

// scale to cover + center crop to exact WxH, cap fps at 30
const cover = (w, h) => `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=30`;

async function encodeLoop(src, out, w, h, start, duration, crf) {
  if (!FORCE && (await exists(out))) return;
  await run([
    "-ss", String(start), "-t", String(duration), "-i", src,
    "-vf", cover(w, h), "-an",
    "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-profile:v", "high", "-level", "4.0",
    "-pix_fmt", "yuv420p", "-g", "60", "-movflags", "+faststart",
    out,
  ]);
}

async function poster(src, out, w, h, at) {
  if (!FORCE && (await exists(out))) return;
  await run(["-ss", String(at), "-i", src, "-frames:v", "1", "-vf", cover(w, h).replace(",fps=30", ""), "-c:v", "libwebp", "-quality", "78", out]);
}

async function still(src, out, w, h) {
  if (!FORCE && (await exists(out))) return;
  const vf = h ? cover(w, h).replace(",fps=30", "") : `scale=${w}:-2`;
  await run(["-i", src, "-frames:v", "1", "-vf", vf, "-c:v", "libwebp", "-quality", "80", out]);
}

async function sizeKB(p) {
  return Math.round((await stat(p)).size / 1024);
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(__dirname, "media.manifest.json"), "utf8"));
  await Promise.all(Object.values(OUT).map((d) => mkdir(d, { recursive: true })));
  const report = [];

  for (const item of manifest.items) {
    if (ONLY && !ONLY.has(item.name)) continue;
    const { name, kind } = item;
    const start = item.start ?? 0;
    const dur = item.duration ?? 8;
    process.stdout.write(`▸ ${kind} ${name}\n`);
    try {
      if (kind === "loop" || kind === "vloop") {
        const src = kind === "loop" ? await download(item.src) : null;
        const srcV = item.srcV ? await download(item.srcV) : src;
        const startV = item.startV ?? start;
        if (kind === "loop") {
          const outH = path.join(OUT.loops, `${name}-h.mp4`);
          await encodeLoop(src, outH, 1280, 720, start, dur, item.crf ?? 26);
          await poster(src, path.join(OUT.posters, `${name}-h.webp`), 1280, 720, start + Math.min(1, dur / 2));
          if (item.poster45 !== false) await poster(src, path.join(OUT.posters, `${name}-45.webp`), 864, 1080, start + Math.min(1, dur / 2));
          report.push({ name, file: `loops/${name}-h.mp4`, kb: await sizeKB(outH) });
        }
        const outV = path.join(OUT.loops, `${name}-v.mp4`);
        await encodeLoop(srcV, outV, 720, 1280, startV, dur, item.crfV ?? 27);
        await poster(srcV, path.join(OUT.posters, `${name}-v.webp`), 720, 1280, startV + Math.min(1, dur / 2));
        report.push({ name, file: `loops/${name}-v.mp4`, kb: await sizeKB(outV) });
      } else if (kind === "still") {
        const src = await download(item.src);
        const out = path.join(OUT.stills, `${name}.webp`);
        await still(src, out, item.w ?? 1600, item.h);
        if (item.also45) await still(src, path.join(OUT.stills, `${name}-45.webp`), 864, 1080);
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
  await writeFile(path.join(ROOT, "public/media/manifest.json"), JSON.stringify({ generated: new Date().toISOString(), report }, null, 2));
  console.log(`\n${report.filter((r) => !r.error).length} файлов готово, ${report.filter((r) => r.error).length} ошибок`);
  if (over.length) console.log(`⚠ превышают бюджет (H ≤4 МБ, V ≤3 МБ): ${over.map((r) => `${r.file} ${r.kb}KB`).join(", ")} — уменьшите duration или поднимите crf`);
}

main().catch((e) => { console.error(e); process.exit(1); });
