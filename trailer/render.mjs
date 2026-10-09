// node render.mjs --stills 1.4,4.5,7.5,8.8,11.5,14.5,17.3,23.5,26.5,30   (контрольные кадры)
// node render.mjs --all                                                    (все кадры → frames/ → mp4)
import { writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { launch } from "./cdp.mjs";

const require = createRequire("/Users/dmitrychurikov/Documents/ПРОЕКТЫ/MADELARME/package.json");
const ffmpeg = require("ffmpeg-static");
const DIR = new URL("./", import.meta.url).pathname;
const URL_ = "http://127.0.0.1:3995/index.html";
const FPS = 30;
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };

const page = await launch({ width: 1080, height: 1920, dpr: 1 });
await page.goto(URL_, 3000);
await page.evalJs("await window.__ready; return true");
const dur = await page.evalJs("return window.__duration");

if (opt("stills")) {
  mkdirSync(DIR + "stills", { recursive: true });
  for (const t of opt("stills").split(",").map(Number)) {
    await page.evalJs(`return await window.__seek(${t})`);
    writeFileSync(`${DIR}stills/t${t.toFixed(2)}.jpg`, await page.shot({ format: "jpeg", quality: 85 }));
  }
  console.log("stills ok", page.logs.filter((l) => /error|EXC/i.test(l)).slice(0, 5));
} else if (args.includes("--all")) {
  const frames = DIR + "frames/";
  rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
  const total = Math.round(dur * FPS);
  const t0 = performance.now();
  for (let f = 0; f < total; f++) {
    await page.evalJs(`return await window.__seek(${(f / FPS).toFixed(5)})`);
    writeFileSync(`${frames}f${String(f).padStart(5, "0")}.jpg`, await page.shot({ format: "jpeg", quality: 93 }));
    if (f % 60 === 0) console.log(`frame ${f}/${total}  ${((performance.now() - t0) / 1000).toFixed(0)}s`);
  }
  console.log("frames", readdirSync(frames).length, "errors", page.logs.filter((l) => /error|EXC/i.test(l)).slice(0, 5));
  const out = opt("out") ?? DIR + "madelarme-trailer-9x16.mp4";
  const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}f%05d.jpg`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2",
    "-movflags", "+faststart", "-vf", "format=yuv420p", out], { stdio: "inherit" });
  console.log("ffmpeg exit", r.status, out);
}
page.close();
