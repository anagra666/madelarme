// Minimal CDP driver for headless Chrome: launch(), page.send(), page.eval(), page.shot()
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

export async function launch({ width, height, dpr = 1, mobile = false }) {
  const port = 9600 + Math.floor(Math.random() * 300);
  const prof = path.join(os.tmpdir(), `trailer-prof-${port}`);
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--mute-audio",
    "--autoplay-policy=no-user-gesture-required", "--force-color-profile=srgb",
    `--window-size=${Math.max(width, 500)},${height}`, `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank",
  ], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(150); } }
  const t = targets.find((x) => x.type === "page");
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); return; }
    if (d.method === "Runtime.consoleAPICalled") logs.push(d.params.type + ": " + d.params.args.map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Runtime.exceptionThrown") logs.push("EXC " + (d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text));
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
  if (mobile) {
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  }
  const evalJs = async (expression) => {
    const r = await send("Runtime.evaluate", { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  const shot = async (opts = {}) => {
    const s = await send("Page.captureScreenshot", { format: opts.format ?? "png", quality: opts.quality, clip: opts.clip, captureBeyondViewport: false, optimizeForSpeed: opts.fast ?? false });
    return Buffer.from(s.result.data, "base64");
  };
  const goto = async (url, wait = 4000) => { await send("Page.navigate", { url }); await sleep(wait); };
  const close = () => { try { ws.close(); } catch {} try { chrome.kill(); } catch {} try { rmSync(prof, { recursive: true, force: true }); } catch {} };
  return { send, evalJs, shot, goto, close, logs };
}
