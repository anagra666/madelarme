import { fileURLToPath } from "node:url";
// Саунд-дизайн для «Монтажки» (16:9, 46 с): синтез с нуля, без сэмплов.
// node sound-h.mjs [out.wav]  → 48 кГц, стерео, 16 бит.
// Все реплики привязаны к таймлайну h/index.html (секунды), бит 120 BPM от 9.0.
import { writeFileSync } from "node:fs";

const SR = 48000, DUR = 46, N = SR * DUR;
const OUT = process.argv[2] ?? fileURLToPath(new URL("./audio-h.wav", import.meta.url));
const TAU = Math.PI * 2;

// шины: ударные, музыка (под дакингом от бочки), эффекты, посыл в ревер
const bus = () => [new Float32Array(N), new Float32Array(N)];
const DR = bus(), MU = bus(), FX = bus(), SEND = new Float32Array(N);

let seed = 0x1234567;
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967295) * 2 - 1; };
const S = (t) => Math.round(t * SR);
const put = (B, i, v, pan = 0, send = 0) => {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  B[0][i] += v * l * 1.414; B[1][i] += v * r * 1.414; if (send) SEND[i] += v * send;
};
const lp = (fc) => 1 - Math.exp(-TAU * fc / SR);
const svf = () => { let low = 0, band = 0; return (x, fc, q = .7) => { const f = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6.5) / SR); low += f * band; const high = x - low - q * band; band += f * high; return [low, band, high]; }; };

/* ── инструменты ── */
const KICKS = [];
function kick(t, a = 1, send = .04) {
  KICKS.push(t); const i0 = S(t), n = S(.45); let ph = 0;
  for (let k = 0; k < n; k++) {
    const x = k / SR, f = 46 + 110 * Math.exp(-x / .028);
    ph += TAU * f / SR;
    const env = Math.exp(-x / .16) * (x < .002 ? x / .002 : 1);
    const click = k < 120 ? rnd() * .35 * (1 - k / 120) : 0;
    put(DR, i0 + k, a * (Math.tanh(Math.sin(ph) * 1.6) * env + click), 0, send);
  }
}
function hat(t, a = .22, open = false, pan = .18) {
  const i0 = S(t), d = open ? .16 : .035, n = S(d * 5); let lo = 0;
  for (let k = 0; k < n; k++) { const x = rnd(); lo += lp(7000) * (x - lo); const hp = x - lo; put(DR, i0 + k, a * hp * Math.exp(-(k / SR) / d), pan, .05); }
}
function clap(t, a = .5, pan = 0, send = .22, tone = 1400) {
  const i0 = S(t), n = S(.32), f = svf();
  for (let k = 0; k < n; k++) {
    const x = k / SR; const bursts = [0, .009, .019].reduce((s, o) => s + (x >= o ? Math.exp(-(x - o) / .006) : 0), 0) * .55;
    const env = bursts + Math.exp(-x / .09) * .6;
    const [, bp] = f(rnd(), tone, .5);
    put(DR, i0 + k, a * bp * env * 1.6, pan, send);
  }
}
function bassNote(t, d, fr, a = .32) {
  const i0 = S(t), n = S(d + .05); let ph = 0;
  for (let k = 0; k < n; k++) {
    const x = k / SR; ph += TAU * fr / SR;
    const env = Math.min(1, x / .006) * (x > d ? Math.exp(-(x - d) / .015) : 1) * (.75 + .25 * Math.exp(-x / .08));
    const v = Math.tanh((Math.sin(ph) + .35 * Math.sin(2 * ph) + .12 * Math.sin(3 * ph)) * 1.4);
    put(MU, i0 + k, a * v * env, 0, 0);
  }
}
function pad(t0, t1, freqs, a = .12, cut0 = 500, cut1 = 1400, att = .6, rel = .8, send = .45) {
  const i0 = S(t0), n = S(t1 - t0 + rel); const phs = freqs.flatMap(() => [rnd() + 1, rnd() + 1, rnd() + 1]);
  const det = [1, 1.0041, .9959]; let yl = 0, yr = 0; const len = t1 - t0;
  for (let k = 0; k < n; k++) {
    const x = k / SR; let l = 0, r = 0;
    freqs.forEach((fr, j) => det.forEach((dt, m) => {
      const p = j * 3 + m; phs[p] = (phs[p] + fr * dt / SR) % 1; const saw = phs[p] * 2 - 1;
      if (m === 1) l += saw; else if (m === 2) r += saw; else { l += saw * .6; r += saw * .6; }
    }));
    const cut = cut0 + (cut1 - cut0) * Math.min(1, x / Math.max(.01, len));
    yl += lp(cut) * (l - yl); yr += lp(cut) * (r - yr);
    const env = Math.min(1, x / att) * (x > len ? Math.exp(-(x - len) / (rel / 3)) : 1);
    const g = a * env / freqs.length;
    if (i0 + k < N) { MU[0][i0 + k] += yl * g; MU[1][i0 + k] += yr * g; SEND[i0 + k] += (yl + yr) * g * send * .5; }
  }
}
function pluck(t, fr, a = .1, pan = 0) {
  const i0 = S(t), n = S(.4); let ph = rnd() + 1, y = 0;
  for (let k = 0; k < n; k++) {
    const x = k / SR; ph = (ph + fr / SR) % 1; const saw = ph * 2 - 1;
    y += lp(400 + 5000 * Math.exp(-x / .05)) * (saw - y);
    put(MU, i0 + k, a * y * Math.exp(-x / .14) * Math.min(1, x / .002), pan, .35);
  }
}
function whoosh(t0, t1, a = .4, f0 = 300, f1 = 4000, pan0 = -.6, pan1 = .6, send = .3, peak = .7) {
  const i0 = S(t0), n = S(t1 - t0), f = svf();
  for (let k = 0; k < n; k++) {
    const u = k / n, fc = f0 * Math.pow(f1 / f0, u);
    const env = u < peak ? Math.pow(u / peak, 2) : Math.pow((1 - u) / (1 - peak), 1.5);
    const [, bp] = f(rnd(), fc, .9);
    put(FX, i0 + k, a * bp * env, pan0 + (pan1 - pan0) * u, send);
  }
}
function boom(t, a = 1, f0 = 70, f1 = 32, dec = 1.2, noise = .35, send = .5) {
  const i0 = S(t), n = S(dec * 4); let ph = 0, lo = 0;
  for (let k = 0; k < n; k++) {
    const x = k / SR, fr = f1 + (f0 - f1) * Math.exp(-x / .25); ph += TAU * fr / SR;
    const nz = rnd(); lo += lp(900) * (nz - lo);
    const v = Math.tanh(Math.sin(ph) * 1.8) * Math.exp(-x / dec) + lo * noise * Math.exp(-x / .18) * 2.2;
    put(FX, i0 + k, a * v * Math.min(1, x / .003), 0, send);
  }
}
function uiClick(t, a = .35, fr = 2600, pan = 0) {
  const i0 = S(t), n = S(.04); let ph = 0;
  for (let k = 0; k < n; k++) { const x = k / SR; ph += TAU * fr / SR; put(FX, i0 + k, a * (Math.sin(ph) * Math.exp(-x / .006) + rnd() * .5 * Math.exp(-x / .0015)), pan, .08); }
  const n2 = S(.05); let ph2 = 0;
  for (let k = 0; k < n2; k++) { const x = k / SR; ph2 += TAU * 180 / SR; put(FX, i0 + S(.012) + k, a * .5 * Math.sin(ph2) * Math.exp(-x / .012), pan, 0); }
}
function key(t, a = .22, pan = 0) {
  const i0 = S(t), n = S(.05), f = svf(); const tone = 2600 + rnd() * 900; let ph = 0; const th = 140 + rnd() * 40;
  for (let k = 0; k < n; k++) { const x = k / SR; const [, bp] = f(rnd(), tone, .6); ph += TAU * th / SR; put(FX, i0 + k, a * (bp * 1.6 * Math.exp(-x / .004) + .5 * Math.sin(ph) * Math.exp(-x / .012)), pan, .04); }
}
function blip(t, fr, a = .2, d = .09, pan = 0, send = .2) {
  const i0 = S(t), n = S(d * 4); let ph = 0;
  for (let k = 0; k < n; k++) { const x = k / SR, f = fr * (1 + .5 * Math.exp(-x / .012)); ph += TAU * f / SR; put(FX, i0 + k, a * Math.sin(ph) * Math.exp(-x / d) * Math.min(1, x / .001), pan, send); }
}
function thunk(t, fr = 90, a = .5, pan = 0) {
  const i0 = S(t), n = S(.25); let ph = 0;
  for (let k = 0; k < n; k++) { const x = k / SR, f = fr * (1 + .8 * Math.exp(-x / .015)); ph += TAU * f / SR; put(FX, i0 + k, a * (Math.sin(ph) * Math.exp(-x / .06) + (k < 200 ? rnd() * .4 * (1 - k / 200) : 0)), pan, .12); }
}
function razor(t, a = .55, pan = 0) {
  const i0 = S(t), n = S(.6); const parts = [[3150, .5, .09], [4720, .35, .07], [6290, .22, .05], [1580, .3, .12]].map(([f, g, d]) => [f * (1 + rnd() * .01), g, d, 0]);
  let lo = 0;
  for (let k = 0; k < n; k++) {
    const x = k / SR; let v = 0;
    parts.forEach((p) => { p[3] += TAU * p[0] / SR; v += Math.sin(p[3]) * p[1] * Math.exp(-x / p[2]); });
    const nz = rnd(); lo += lp(3000) * (nz - lo);
    v += (nz - lo) * 1.4 * Math.exp(-x / .004);
    put(FX, i0 + k, a * v * .7, pan, .25);
  }
  thunk(t, 120, .35, pan);
}
function bell(t, fr = 1318.5, a = .35, d = 1.6) {
  const i0 = S(t), n = S(d * 3.5); const parts = [[1, 1, 1], [2, .45, .7], [2.76, .25, .5], [5.4, .12, .3], [.5, .3, 1.2]].map(([r, g, dd]) => [fr * r, g, d * dd, 0]);
  for (let k = 0; k < n; k++) { const x = k / SR; let v = 0; parts.forEach((p) => { p[3] += TAU * p[0] / SR; v += Math.sin(p[3]) * p[1] * Math.exp(-x / p[2]); }); put(FX, i0 + k, a * v * Math.min(1, x / .002), 0, .55); }
}
function scrub(t0, t1, a = .18) {
  const i0 = S(t0), n = S(t1 - t0), f = svf();
  for (let k = 0; k < n; k++) {
    const x = k / SR, u = k / n; const grain = .5 + .5 * Math.sin(TAU * (18 + 10 * Math.sin(x * 7)) * x);
    const [, bp] = f(rnd(), 900 + 1500 * grain, .8);
    put(FX, i0 + k, a * bp * grain * Math.sin(Math.PI * u), .2 * Math.sin(x * 3), .1);
  }
}
function room(t0, t1, a = .012) {
  const i0 = S(t0), n = S(t1 - t0); let l = 0, r = 0, l2 = 0, r2 = 0;
  for (let k = 0; k < n; k++) { l += lp(380) * (rnd() - l); r += lp(380) * (rnd() - r); l2 += lp(380) * (l - l2); r2 += lp(380) * (r - r2); const u = k / n; const env = Math.min(1, u * 8) * Math.min(1, (1 - u) * 8); if (i0 + k < N) { FX[0][i0 + k] += l2 * a * 6 * env; FX[1][i0 + k] += r2 * a * 6 * env; } }
}

/* ── партитура ── */
const B = .5, T0 = 9; // доля и начало бита
const CH = [ // Am, F, C, G
  { bass: 55, pad: [220, 261.63, 329.63], arp: [440, 523.25, 659.26, 880] },
  { bass: 43.65, pad: [174.61, 220, 261.63], arp: [349.23, 440, 523.25, 698.46] },
  { bass: 65.41, pad: [196, 261.63, 329.63], arp: [392, 523.25, 659.26, 783.99] },
  { bass: 49, pad: [196, 246.94, 293.66], arp: [392, 493.88, 587.33, 783.99] },
];
const chordAt = (t) => CH[Math.floor((t - T0) / 2) % 4];
const beats = (a, b, step = B, off = 0) => { const r = []; for (let t = a + off; t < b - 1e-6; t += step) r.push(+t.toFixed(4)); return r; };

// 0–9: тишина студии, новый проект, сборка интерфейса, импорт
room(0, 46, .012);
blip(.3, 220, .1, .4, 0, .4);                                    // кнопка проявляется
uiClick(1.7, .5, 2400);                                           // клик «Новый проект»
[1.95, 2.07, 2.19, 2.31].forEach((t, i) => whoosh(t - .05, t + .3, .14, 600, 5000, -.5 + i * .33, -.2 + i * .33, .15, .4)); // панели
for (let k = 1; k <= 24; k++) key(2.6 + (k - .5) * .05 + rnd() * .006, .28, -.25 + (k % 5) * .08); // печать имени проекта
const PENTA = [523.25, 587.33, 659.26, 783.99, 880, 1046.5];
for (let i = 0; i < 12; i++) blip(4.0 + i * .09, PENTA[i % 6] * (i >= 6 ? 1.5 : 1), .13, .06, -.6 + (i % 3) * .6, .25); // превью в бин
for (let i = 0; i < 7; i++) thunk(5.6 + i * .22, [55, 65.41, 73.42, 82.41, 98, 110, 130.81][i] * 1.5, .45, -.4 + i * .13); // клипы на V1
for (let i = 0; i < 5; i++) blip(7.2 + i * .12, 1760 + i * 110, .09, .03, .3, .1);  // титры на V3
[7.75, 7.87].forEach((t) => thunk(t, 196, .25, -.2));
whoosh(8.0, 8.6, .16, 200, 2400, -.3, .3, .2, .9);              // звук растягивается
pad(4.0, 9.0, [110, 164.81, 220, 261.63], .2, 180, 900, 2.5, .25, .5); // напряжение до плея
whoosh(8.1, 9.0, .22, 400, 9000, .4, -.4, .35, .95);             // подсос в дроп

// 9: play → бит
uiClick(9.0, .45, 2000); boom(9.0, .75, 80, 34, .8, .4, .45);
const groove = (a, b, { kickOn = true, hats = true, claps = false, open = false, bass = true, hatA = .2 } = {}) => {
  if (kickOn) beats(a, b).forEach((t) => kick(t, .95));
  if (hats) beats(a, b, B, B / 2).forEach((t, i) => hat(t, hatA, open && i % 2 === 1, i % 2 ? .25 : -.15));
  if (hats) beats(a, b, B / 2, B / 4).forEach((t, i) => i % 2 === 0 && hat(t, hatA * .35, false, .4));
  if (claps) beats(a, b, 1, .5).forEach((t) => clap(t, .5, 0, .22));
  if (bass) beats(a, b, B / 2).forEach((t) => bassNote(t, .2, chordAt(t).bass, .3));
};
groove(9, 12.5, { hatA: .16 });
groove(12.5, 15, { hatA: .2 });
whoosh(12.4, 13.4, .55, 150, 7000, -.8, .8, .4, .85);            // окно рвется на весь экран
boom(13.35, .5, 60, 30, .9, .5, .5);
beats(9, 15, 2).forEach((t) => pad(t, t + 2, chordAt(t).pad, .1, 500, 900, .3, .4, .4));

// 15–21: бритва
boom(15.0, .8, 72, 34, .9, .45, .45);
key(15.25, .3, .3);
groove(15, 21, { claps: true, hatA: .2 });
[16, 17, 18, 19, 20].forEach((t, i) => razor(t, .55, -.35 + i * .17));
beats(15, 21, 2).forEach((t) => pad(t, t + 2, chordAt(t).pad, .09, 600, 1100, .2, .4, .4));

// 21–28: два экрана
boom(21.0, .8, 72, 34, .9, .45, .45);
whoosh(20.75, 21.35, .4, 300, 6000, -.8, -.1, .3, .7); whoosh(20.9, 21.5, .35, 300, 6000, .8, .1, .3, .7);
groove(21, 28, { claps: true, open: true, hatA: .22 });
beats(21, 28, .25).forEach((t, i) => { const c = chordAt(t).arp; pluck(t, c[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]], .085, i % 2 ? .35 : -.35); });
beats(21, 28, 2).forEach((t) => pad(t, t + 2, chordAt(t).pad, .1, 700, 1500, .2, .4, .4));
[22.4, 23.4, 24.4, 25.4].forEach((t) => { blip(t, 2093, .08, .04, -.3, .3); hat(t, .12, false, -.3); });  // ховер по строкам
[[22.6, .8], [24.0, .8], [25.4, .9]].forEach(([t, d]) => whoosh(t, t + d, .12, 800, 3000, .5, .6, .15, .35)); // скролл телефона

// 28–33: титры (без бочки, фильтр)
boom(28.0, .7, 66, 30, 1.4, .3, .7);
pad(28, 33.2, [110, 164.81, 220, 261.63, 329.63], .22, 380, 700, .4, .6, .7);
beats(28, 30.6, 1).forEach((t, i) => bassNote(t, .9, [55, 43.65, 65.41][i % 3], .26));
beats(28, 30.8, B / 2).forEach((t, i) => hat(t, .06, false, i % 2 ? .4 : -.4));
for (let i = 0; i < 9; i++) blip(28.1 + i * .1, 1318.5 + (i % 3) * 220, .045, .05, -.3 + i * .07, .4); // строки титров
whoosh(30.25, 31.0, .3, 200, 3000, 0, 0, .5, .97);                // обратный свелл
boom(31.0, .65, 58, 28, 1.6, .25, .7); clap(31.0, .3, 0, .6, 900);

// 33–38: цвет
boom(33.0, .75, 72, 34, .9, .45, .45);
uiClick(33.0, .3, 2200, .2);
groove(33, 38, { claps: true, hatA: .18 });
beats(33, 38, 2).forEach((t) => pad(t, t + 2, chordAt(t).pad, .1, 400, 2200, .2, .4, .4)); // фильтр открывается, как грейдинг
scrub(33.6, 34.6, .2); scrub(35.0, 35.5, .16);
uiClick(33.6, .2, 3000, .1); uiClick(35.0, .2, 3000, .25);
clap(35.55, .35, 0, .5, 1000); hat(35.55, .25, true, 0);

// 38–42: экспорт
boom(38.0, .7, 72, 34, .8, .4, .45);
whoosh(37.95, 38.45, .2, 1200, 6000, 0, 0, .25, .3);           // модалка
groove(38, 40.6, { claps: false, hatA: .2 });
uiClick(38.6, .5, 2400);
whoosh(38.6, 41.2, .5, 250, 9000, -.3, .3, .35, .985);           // райзер
{ const i0 = S(38.6), n = S(2.6); let ph = 0; for (let k = 0; k < n; k++) { const u = k / n, f = 220 * Math.pow(8, u * u); ph += TAU * f / SR; put(FX, i0 + k, .09 * u * u * Math.sin(ph + .3 * Math.sin(TAU * 6 * k / SR)), 0, .3); } }
[...beats(38.6, 39.6, .25), ...beats(39.6, 40.4, .125), ...beats(40.4, 41.15, .0625)].forEach((t) => clap(t, .12 + .3 * ((t - 38.6) / 2.6), 0, .15, 1100 + 1400 * ((t - 38.6) / 2.6)));
bell(41.2, 1318.5, .38, 1.1); bell(41.2, 659.26, .18, 1.3);       // «Готово»
whoosh(41.45, 42.0, .3, 200, 5000, 0, 0, .3, .98);

// 42–46: финал
boom(42.0, 1.1, 85, 30, 1.8, .5, .6); kick(42.0, 1); clap(42.0, .45, 0, .7, 1000);
pad(42.0, 45.4, [110, 164.81, 220, 261.63, 329.63, 493.88], .3, 900, 600, .05, 1.2, .7);
bassNote(42.0, 2.2, 55, .3);
[42.8, 42.92, 43.04, 43.16].forEach((t, i) => blip(t, [880, 1046.5, 1318.5, 1760][i], .05, .06, -.3 + i * .2, .4));
uiClick(44.6, .45, 1500); thunk(44.66, 70, .4);                  // «Стоп»
whoosh(45.25, 45.85, .3, 120, 1500, 0, 0, .3, .9); boom(45.85, .55, 50, 28, .5, .3, .4);

/* ── сведение ── */
// дакинг музыки от бочки
const duck = new Float32Array(N).fill(1);
KICKS.sort((a, b) => a - b).forEach((t) => { const i0 = S(t); for (let k = 0; k < S(.3); k++) if (i0 + k < N) duck[i0 + k] = Math.min(duck[i0 + k], 1 - .55 * Math.exp(-(k / SR) / .09)); });
// Шредер-ревер на посыле
function reverb(inp, off) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round((d + off) * SR / 44100) * 2);
  const out = new Float32Array(N);
  combs.forEach((d) => { const buf = new Float32Array(d); let p = 0, lo = 0; for (let i = 0; i < N; i++) { const y = buf[p]; lo += .3 * (y - lo); buf[p] = inp[i] + lo * .86; p = (p + 1) % d; out[i] += y / combs.length; } });
  [225, 556, 441].map((d) => Math.round((d + off) * SR / 44100)).forEach((d) => { const buf = new Float32Array(d); let p = 0; for (let i = 0; i < N; i++) { const b = buf[p], x = out[i]; const y = -x + b; buf[p] = x + b * .5; out[i] = y; p = (p + 1) % d; } });
  return out;
}
const RL = reverb(SEND, 0), RR = reverb(SEND, 23);
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, i / S(.02), (N - i) / S(.35));
  L[i] = (DR[0][i] * .9 + MU[0][i] * duck[i] + FX[0][i] + RL[i] * .55) * fade;
  R[i] = (DR[1][i] * .9 + MU[1][i] * duck[i] + FX[1][i] + RR[i] * .55) * fade;
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const drive = 1.6 / peak; let p2 = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * drive); R[i] = Math.tanh(R[i] * drive); p2 = Math.max(p2, Math.abs(L[i]), Math.abs(R[i])); }
const g = Math.pow(10, -1 / 20) / p2;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
writeFileSync(OUT, buf);
console.log("wav", OUT, "peak in", peak.toFixed(2), "kicks", KICKS.length);
