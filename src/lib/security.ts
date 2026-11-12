/**
 * Политика безопасности сайта: один источник для next.config.ts (Node-режим), <meta> в layout.tsx (статика)
 * и текстов в scripts/static.htaccess, scripts/package-preview.sh и README.
 * Страницы пререндерятся (SSG/export), поэтому nonce невозможны: 'unsafe-inline' для inline-скриптов Next
 * (docs: content-security-policy.md, «Without Nonces»).
 */

/** Откуда разрешены iframe. Плеер (Player.tsx) умеет и vimeo/bunny/kinescope: добавлять сюда, только когда кейсы начнут их использовать. */
const FRAME_SRC = ["https://www.youtube-nocookie.com"];
/* const FRAME_SRC_OPTIONAL = ["https://player.vimeo.com", "https://iframe.mediadelivery.net", "https://kinescope.io"]; */

/**
 * @param dev  dev-сервер: нужен 'unsafe-eval' (React/HMR)
 * @param meta вариант для <meta http-equiv>: frame-ancestors там не работает, поэтому его не пишем
 */
export function buildCsp({ dev = false, meta = false }: { dev?: boolean; meta?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:", // data: = SVG-зерно в globals.css
    "font-src 'self'",
    "media-src 'self' blob:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`, // fetch /api/lead, RSC, HMR в dev
    `frame-src ${FRAME_SRC.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(meta ? [] : ["frame-ancestors 'none'"]),
  ].join("; ");
}

/** Permissions-Policy: fullscreen/autoplay/encrypted-media/PiP не трогаем — их делегирует iframe плеера (атрибут allow). */
export const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()";

export const REFERRER_POLICY = "strict-origin-when-cross-origin";
