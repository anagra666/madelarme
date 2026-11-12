#!/usr/bin/env bash
# Собирает самодостаточный бандл для тестового домена (закрыт от индексации) и упаковывает в zip.
#   pnpm package:preview            → dist/madelarme-preview-<date>.zip
#   PREVIEW_URL=https://test.example.kz pnpm package:preview   (для og:url / canonical)
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d-%H%M)
NAME="madelarme-preview-$STAMP"
OUT="dist/$NAME"
PREVIEW_URL="${PREVIEW_URL:-https://preview.madelarme.kz}"

echo "▸ next build (noindex, standalone)"
rm -rf .next/standalone
NEXT_PUBLIC_NOINDEX=1 NEXT_PUBLIC_SITE_URL="$PREVIEW_URL" pnpm exec next build >/dev/null

echo "▸ assembling $OUT"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -R .next/standalone/. "$OUT/"
mkdir -p "$OUT/.next/static" "$OUT/public"
cp -R .next/static/. "$OUT/.next/static/"
cp -R public/. "$OUT/public/"
# служебные файлы медиа-пайплайна на сервере не нужны
rm -f "$OUT/public/media/manifest.json"
# sharp (нативный, только для macOS-сборки) не нужен: images.unoptimized
rm -rf "$OUT"/node_modules/.pnpm/sharp@* "$OUT"/node_modules/.pnpm/@img+* "$OUT"/node_modules/.pnpm/node_modules/@img "$OUT"/node_modules/.pnpm/node_modules/sharp

cat > "$OUT/.env" <<EOF
# тестовый домен: индексация запрещена уже при сборке (NEXT_PUBLIC_NOINDEX=1)
PORT=3033
HOSTNAME=127.0.0.1
# заявки с формы → Telegram (без этих переменных форма отвечает «Не отправилось» и предлагает написать в WhatsApp)
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
# IP для лимита заявок берётся из X-Real-IP, только когда он точно от нашего nginx
# (nginx.preview.conf ставит его в $remote_addr, а Node слушает 127.0.0.1). Без прокси перед Node - не включать.
TRUST_PROXY=1
EOF

cat > "$OUT/madelarme-preview.service" <<'EOF'
[Unit]
Description=MADELARME preview (Next.js standalone)
After=network.target

[Service]
WorkingDirectory=/var/www/madelarme-preview
EnvironmentFile=/var/www/madelarme-preview/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
User=www-data

[Install]
WantedBy=multi-user.target
EOF

cat > "$OUT/nginx.preview.conf" <<'EOF'
# /etc/nginx/sites-available/madelarme-preview  →  ln -s в sites-enabled, затем certbot --nginx -d ТЕСТ-ДОМЕН
server {
    listen 80;
    server_name ТЕСТ-ДОМЕН;

    # Страницы и /api/lead проксируются в Next: заголовки безопасности и X-Robots-Tag шлёт он сам (next.config.ts).
    # Статику ниже nginx отдаёт напрямую, а location со своим add_header не наследует серверные,
    # поэтому те же заголовки подключаем в каждый такой location одним файлом.

    # загрузок на сайте нет; заявки - маленький JSON (см. location = /api/lead)
    client_max_body_size 1m;

    # статика Next.js — кэшируем навсегда (имена файлов с хэшами)
    location /_next/static/ {
        alias /var/www/madelarme-preview/.next/static/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
        include snippets/madelarme-headers.conf;
    }

    # медиа (лупы mp4, постеры) — отдаём напрямую, с Range для видео
    location /media/ {
        alias /var/www/madelarme-preview/public/media/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
        include snippets/madelarme-headers.conf;
    }

    location = /api/lead {
        client_max_body_size 64k;
        proxy_pass http://127.0.0.1:3033;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3033;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# заголовки: положить в /etc/nginx/snippets/madelarme-headers.conf (политика CSP - src/lib/security.ts)
cat > "$OUT/madelarme-headers.conf" <<'EOF'
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" always;
EOF

cat > "$OUT/README-DEPLOY.md" <<EOF
# MADELARME — тестовая сборка ($STAMP)

Самодостаточный Next.js-сервер: нужен только **Node.js 20.9+** (лучше 22 LTS). Никаких \`npm install\` — все зависимости внутри.
**Важно:** распаковывайте zip прямо на сервере (\`unzip\`), а не на Mac с последующей заливкой по FTP — внутри \`node_modules\` относительные символические ссылки pnpm, FTP-клиенты их ломают.
**Сайт закрыт от индексации** при сборке: \`robots.txt\` → \`Disallow: /\`, \`<meta name="robots" content="noindex,nofollow">\` на каждой странице, заголовок \`X-Robots-Tag\` на каждом ответе.

## Запуск

\`\`\`bash
unzip $NAME.zip -d /var/www && mv /var/www/$NAME /var/www/madelarme-preview
cd /var/www/madelarme-preview
node --env-file=.env server.js   # слушает 127.0.0.1:3033 (порт и хост из .env; без --env-file встанет на 0.0.0.0:3000 в обход nginx)
\`\`\`

Проверка: \`curl -sI http://127.0.0.1:3033/ | grep -iE 'x-robots|content-security|x-frame|referrer'\` → \`noindex, nofollow, …\` и заголовки безопасности; \`curl http://127.0.0.1:3033/robots.txt\` → \`Disallow: /\`.

## Как сервис

\`\`\`bash
cp madelarme-preview.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now madelarme-preview
\`\`\`

(или \`pm2 start server.js --name madelarme-preview --node-args="--env-file=.env"\`)

## Nginx + HTTPS

\`madelarme-headers.conf\` положите в \`/etc/nginx/snippets/\` (на него ссылается конфиг: запрет индексации и заголовки безопасности для статики и медиа). \`nginx.preview.conf\` — впишите тестовый домен вместо \`ТЕСТ-ДОМЕН\`, положите в \`sites-available\`, включите, затем \`certbot --nginx -d ТЕСТ-ДОМЕН\`. Без HTTPS превью ссылок в WhatsApp/Telegram не собирается.

## Заявки с формы

Форма шлёт \`POST /api/lead\`. Чтобы заявки приходили в Telegram — добавьте в \`.env\` \`TELEGRAM_BOT_TOKEN\` и \`TELEGRAM_CHAT_ID\` и перезапустите сервис. Без них сервер отвечает 503, а форма показывает «Не отправилось» и кнопку WhatsApp с готовым текстом заявки. В консоль заявки пишутся только при \`pnpm dev\`. Заявки принимаются только с того же домена (проверка Origin), лимит 5 в минуту на IP.

## Что внутри

- \`server.js\`, \`.next/\`, \`node_modules/\` — приложение (собрано с \`NEXT_PUBLIC_SITE_URL=$PREVIEW_URL\`)
- \`public/media/\` — лупы, постеры и кадры, нарезанные из реальных работ Марии (~32 МБ); полные фильмы играют с YouTube в плеере сайта. Демо осталось только фото на странице «Обо мне».
- \`.env\` — порт и переменные окружения
EOF

echo "▸ zipping"
mkdir -p dist
rm -f "dist/$NAME.zip"
# -y: symlink-и pnpm сохраняем как ссылки (относительные), иначе ломается разрешение модулей
( cd dist && zip -qry "$NAME.zip" "$NAME" -x '*.DS_Store' )
rm -rf "$OUT"
du -h "dist/$NAME.zip" | cut -f1 | xargs -I{} echo "✓ dist/$NAME.zip ({})"
