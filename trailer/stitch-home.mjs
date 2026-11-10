// node stitch-home.mjs — после capture.mjs: склейка мобильной главной и полосы шапки/липкой кнопки.
//   assets/home-long.jpg    780 px шириной, home-sNN.png по offsets из home-offsets.json (CSS px, кадры @2x → y = offset*2)
//   assets/header-strip.png верхние HEADER px кадра home-top.png (шапка поверх hero)
//   assets/sticky-strip.png нижние STICKY px кадра sticky-frame.png (липкая полоса WhatsApp вместе с верхней линией)
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(fileURLToPath(new URL("../package.json", import.meta.url)));
const ffmpeg = require("ffmpeg-static");
const ASSETS = fileURLToPath(new URL("./assets/", import.meta.url));
const CAP = ASSETS + "cap/";
const DPR = 2, W = 390 * DPR;
const HEADER = 112; // 56 CSS px: шапка
const STICKY = 114; // 1 CSS px линия + 56 CSS px полоса
const BG = "0x0e0d0c"; // фон страницы

const run = (args) => {
  const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "));
};

const { offsets, H } = JSON.parse(readFileSync(CAP + "home-offsets.json", "utf8"));
const shots = offsets.map((_, i) => `${CAP}home-s${String(i).padStart(2, "0")}.png`);
for (const s of shots) if (!existsSync(s)) throw new Error("нет кадра " + s);
const total = (offsets.at(-1) + H) * DPR;

// холст + наложение кадров по порядку (следующий перекрывает предыдущий)
const inputs = shots.flatMap((s) => ["-i", s]);
let graph = `color=c=${BG}:s=${W}x${total}:d=1[c0]`;
offsets.forEach((y, i) => { graph += `;[c${i}][${i}:v]overlay=0:${y * DPR}${i === offsets.length - 1 ? ",format=yuvj444p[out]" : `[c${i + 1}]`}`; });
run([...inputs, "-filter_complex", graph, "-map", "[out]", "-frames:v", "1", "-q:v", "3", ASSETS + "home-long.jpg"]);

run(["-i", CAP + "home-top.png", "-vf", `crop=iw:${HEADER}:0:0`, "-frames:v", "1", ASSETS + "header-strip.png"]);
run(["-i", CAP + "sticky-frame.png", "-vf", `crop=iw:${STICKY}:0:ih-${STICKY}`, "-frames:v", "1", ASSETS + "sticky-strip.png"]);
console.log(`home-long.jpg ${W}x${total}, header-strip.png ${W}x${HEADER}, sticky-strip.png ${W}x${STICKY}`);
