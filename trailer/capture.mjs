import { fileURLToPath } from "node:url";
// Снимает экраны сайта для трейлера: длинная мобильная главная (без fixed-слоёв), полоса шапки, sticky-полоса, кейс.
import { writeFileSync, mkdirSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";

const BASE = "http://127.0.0.1:3996";
const OUT = fileURLToPath(new URL("./assets/cap/", import.meta.url));
mkdirSync(OUT, { recursive: true });
const W = 390, H = 844;

async function stitchPage(page, url, name, maxY = 99999) {
  await page.goto(url, 5000);
  // кадр 0 — как видит пользователь (с шапкой)
  writeFileSync(`${OUT}${name}-top.png`, await page.shot());
  // прячем все fixed-слои (шапка, sticky-CTA), чтобы склейка была чистой
  await page.evalJs(`
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') el.style.setProperty('visibility', 'hidden', 'important');
    }
    return true;`);
  const docH = await page.evalJs("return document.documentElement.scrollHeight");
  const end = Math.min(docH, maxY);
  // прогон вниз до конца: Reveal (once) раскрывает строки, иначе у нижнего края кадра заголовки еще под маской и на шве режутся
  await page.evalJs(`for (let y = 0; y < ${end}; y += ${H / 2}) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 1200)); return 1`);
  const ys = [];
  for (let y = 0; y < end - H; y += H) ys.push(y);
  ys.push(Math.max(0, end - H));
  const list = [];
  for (const [i, y] of ys.entries()) {
    await page.evalJs(`window.scrollTo(0, ${y}); await new Promise(r => setTimeout(r, 1600)); return 1`);
    const real = await page.evalJs("return Math.round(window.scrollY)");
    writeFileSync(`${OUT}${name}-s${String(i).padStart(2, "0")}.png`, await page.shot());
    list.push(real);
  }
  writeFileSync(`${OUT}${name}-offsets.json`, JSON.stringify({ docH, end, H, offsets: list }));
  return list;
}

const page = await launch({ width: W, height: H, dpr: 2, mobile: true });
try {
  await stitchPage(page, `${BASE}/`, "home", 7400);
  await stitchPage(page, `${BASE}/work/oyu-fest/`, "case", 3400);
  // sticky-полоса: прокрутка вниз, потом немного вверх — полоса появляется
  await page.goto(`${BASE}/`, 4500);
  await page.evalJs(`window.scrollTo(0, 2200); await new Promise(r=>setTimeout(r,900)); window.scrollTo(0, 2000); await new Promise(r=>setTimeout(r,1400)); return 1`);
  writeFileSync(`${OUT}sticky-frame.png`, await page.shot());
  console.log("logs", page.logs.filter((l) => /error|EXC/i.test(l)).slice(0, 5));
} finally {
  page.close();
}
console.log("done");
