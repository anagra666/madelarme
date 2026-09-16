#!/usr/bin/env node
/**
 * Проверка медиа: каждый путь «/media/...», упомянутый в src/content/*.json,
 * должен существовать в public/media. Заодно считает размер public/media
 * и показывает файлы, на которые никто не ссылается.
 *
 *   node scripts/check-media.mjs          — отчёт, exit 1 если есть битые ссылки
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "src/content");
const PUBLIC = path.join(ROOT, "public");

/** все строки вида "/media/..." из произвольного JSON */
function collect(value, into, where) {
  if (typeof value === "string") {
    if (value.startsWith("/media/")) into.push({ p: value, where });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => collect(v, into, `${where}[${i}]`));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collect(v, into, `${where}.${k}`);
  }
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const refs = [];
for (const f of (await readdir(CONTENT)).filter((n) => n.endsWith(".json"))) {
  const json = JSON.parse(await readFile(path.join(CONTENT, f), "utf8"));
  collect(json, refs, f.replace(".json", ""));
}

const missing = [];
const used = new Set();
for (const r of refs) {
  const abs = path.join(PUBLIC, r.p);
  try {
    await stat(abs);
    used.add(abs);
  } catch {
    missing.push(r);
  }
}

const files = (await walk(path.join(PUBLIC, "media"))).filter((p) => !p.endsWith("manifest.json"));
let total = 0;
const byDir = {};
for (const p of files) {
  const s = (await stat(p)).size;
  total += s;
  const d = path.basename(path.dirname(p));
  byDir[d] = (byDir[d] ?? 0) + s;
}
const orphans = files.filter((p) => !used.has(p));
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} МБ`;

console.log(`ссылок на /media в контенте: ${refs.length} (уникальных: ${new Set(refs.map((r) => r.p)).size})`);
console.log(`файлов в public/media: ${files.length}, всего ${mb(total)} — ${Object.entries(byDir).map(([d, n]) => `${d} ${mb(n)}`).join(" · ")}`);
if (orphans.length) {
  console.log(`без ссылок (${orphans.length}): ${orphans.map((p) => path.relative(PUBLIC, p)).join(", ")}`);
}
if (missing.length) {
  console.error(`\n✗ битые ссылки (${missing.length}):`);
  for (const m of missing) console.error(`  ${m.p}  ← ${m.where}`);
  process.exit(1);
}
console.log("✓ все ссылки на медиа существуют");
