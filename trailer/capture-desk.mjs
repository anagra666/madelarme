import { writeFileSync, mkdirSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";
const BASE = "http://127.0.0.1:3996";
const OUT = new URL("./h/cap/", import.meta.url).pathname; mkdirSync(OUT, { recursive: true });

// 1) hero 1920×1080 без видео/постера/зерна — для наложения поверх нашего видео (lighten)
{
  const p = await launch({ width: 1920, height: 1080 });
  await p.goto(`${BASE}/`, 6000);
  await p.evalJs(`const st=document.createElement('style'); st.textContent='#hero video,#hero picture{visibility:hidden!important} .grain::after{display:none!important} #hero{background:#000!important}'; document.head.appendChild(st); await new Promise(r=>setTimeout(r,800)); return 1`);
  writeFileSync(`${OUT}hero-1920-novideo.png`, await p.shot());
  await p.evalJs(`document.querySelectorAll('style').forEach(s=>{ if(s.textContent.includes('visibility:hidden!important')) s.remove() }); await new Promise(r=>setTimeout(r,1500)); return 1`);
  writeFileSync(`${OUT}hero-1920.png`, await p.shot());
  p.close();
}
// 2) индекс работ на ноутбуке 1440×900: наведение на строки
{
  const p = await launch({ width: 1440, height: 900 });
  await p.goto(`${BASE}/`, 6000);
  const y = await p.evalJs(`const s=document.querySelector('#work'); const r=s.getBoundingClientRect(); return Math.round(r.top + scrollY)`);
  await p.evalJs(`(window.lenis? window.lenis.scrollTo(${y}+40,{immediate:true}) : window.scrollTo(0, ${y}+40)); await new Promise(r=>setTimeout(r,1800)); return 1`);
  writeFileSync(`${OUT}index-0.png`, await p.shot());
  const rows = await p.evalJs(`return [...document.querySelectorAll('#work a[href^="/work/"]')].filter(a=>a.offsetParent && a.getBoundingClientRect().width>800).slice(0,4).map(a=>{const r=a.getBoundingClientRect();return [Math.round(r.left+r.width*0.3),Math.round(r.top+r.height/2), a.getAttribute('href')]})`);
  console.log("rows", JSON.stringify(rows));
  for (const [i, [x, yy]] of rows.entries()) {
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y: yy });
    await sleep(2200);
    writeFileSync(`${OUT}index-r${i + 1}.png`, await p.shot());
  }
  writeFileSync(`${OUT}index-rows.json`, JSON.stringify(rows));
  p.close();
}
console.log("ok");
