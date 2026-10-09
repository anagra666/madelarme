// node render-h.mjs --stills 2,7.5,11,13.8   (контрольные кадры 16:9 → stills-h/)
// node render-h.mjs --all [--from 0 --to 46]  (кадры → frames-h/ → mp4 без звука)
import { writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { launch } from "./cdp.mjs";

const require = createRequire("/Users/dmitrychurikov/Documents/ПРОЕКТЫ/MADELARME/package.json");
const ffmpeg = require("ffmpeg-static");
const DIR = new URL("./", import.meta.url).pathname;
const URL_ = "http://127.0.0.1:3995/h/index.html";
const FPS = 30;
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };

const page = await launch({ width: 1920, height: 1080, dpr: 1 });
await page.goto(URL_, 3000);
await page.evalJs("await window.__ready; return true");
const dur = await page.evalJs("return window.__duration");

if (opt("stills")) {
  mkdirSync(DIR + "stills-h", { recursive: true });
  for (const t of opt("stills").split(",").map(Number)) {
    await page.evalJs(`return await window.__seek(${t})`);
    writeFileSync(`${DIR}stills-h/t${t.toFixed(2)}.jpg`, await page.shot({ format: "jpeg", quality: 85 }));
  }
  console.log("stills ok", page.logs.filter((l) => /error|EXC/i.test(l)).slice(0, 5));
} else if (args.includes("--all")) {
  const frames = DIR + "frames-h/";
  const from = Math.round(Number(opt("from") ?? 0) * FPS), to = Math.round(Number(opt("to") ?? dur) * FPS);
  if (from === 0) { rmSync(frames, { recursive: true, force: true }); }
  mkdirSync(frames, { recursive: true });
  const t0 = performance.now();
  for (let f = from; f < to; f++) {
    await page.evalJs(`return await window.__seek(${(f / FPS).toFixed(5)})`);
    writeFileSync(`${frames}f${String(f).padStart(5, "0")}.jpg`, await page.shot({ format: "jpeg", quality: 92 }));
    if (f % 60 === 0) console.log(`frame ${f}/${to}  ${((performance.now() - t0) / 1000).toFixed(0)}s`);
  }
  console.log("frames", readdirSync(frames).length, "errors", page.logs.filter((l) => /error|EXC/i.test(l)).slice(0, 5));
  if (!args.includes("--noenc")) {
    const out = opt("out") ?? DIR + "h-video.mp4";
    const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}f%05d.jpg`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2", out], { stdio: "inherit" });
    console.log("ffmpeg exit", r.status, out);
  }
}
page.close();
