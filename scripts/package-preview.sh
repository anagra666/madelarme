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
# заявки с формы → Telegram (без этих переменных заявки пишутся в лог сервера)
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
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

    # дублируем запрет индексации на уровне nginx (приложение тоже отдаёт X-Robots-Tag)
    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

    client_max_body_size 20m;

    # статика Next.js — кэшируем навсегда (имена файлов с хэшами)
    location /_next/static/ {
        alias /var/www/madelarme-preview/.next/static/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # медиа (лупы mp4, постеры) — отдаём напрямую, с Range для видео
    location /media/ {
        alias /var/www/madelarme-preview/public/media/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
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

cat > "$OUT/README-DEPLOY.md" <<EOF
# MADELARME — тестовая сборка ($STAMP)

Самодостаточный Next.js-сервер: нужен только **Node.js 20.9+** (лучше 22 LTS). Никаких \`npm install\` — все зависимости внутри.
**Важно:** распаковывайте zip прямо на сервере (\`unzip\`), а не на Mac с последующей заливкой по FTP — внутри \`node_modules\` относительные символические ссылки pnpm, FTP-клиенты их ломают.
**Сайт закрыт от индексации** при сборке: \`robots.txt\` → \`Disallow: /\`, \`<meta name="robots" content="noindex,nofollow">\` на каждой странице, заголовок \`X-Robots-Tag\` на каждом ответе.

## Запуск

\`\`\`bash
unzip $NAME.zip -d /var/www && mv /var/www/$NAME /var/www/madelarme-preview
cd /var/www/madelarme-preview
node server.js            # слушает 127.0.0.1:3033 (см. .env)
\`\`\`

Проверка: \`curl -sI http://127.0.0.1:3033/ | grep -i x-robots\` → \`noindex, nofollow, …\`; \`curl http://127.0.0.1:3033/robots.txt\` → \`Disallow: /\`.

## Как сервис

\`\`\`bash
cp madelarme-preview.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now madelarme-preview
\`\`\`

(или \`pm2 start server.js --name madelarme-preview\`)

## Nginx + HTTPS

\`nginx.preview.conf\` — впишите тестовый домен вместо \`ТЕСТ-ДОМЕН\`, положите в \`sites-available\`, включите, затем \`certbot --nginx -d ТЕСТ-ДОМЕН\`. Без HTTPS превью ссылок в WhatsApp/Telegram не собирается.

## Заявки с формы

Форма шлёт \`POST /api/lead\`. Чтобы заявки приходили в Telegram — добавьте в \`.env\` \`TELEGRAM_BOT_TOKEN\` и \`TELEGRAM_CHAT_ID\` и перезапустите сервис. Без них заявка пишется в лог, а пользователю форма всё равно отвечает «Получила!».

## Что внутри

- \`server.js\`, \`.next/\`, \`node_modules/\` — приложение (собрано с \`NEXT_PUBLIC_SITE_URL=$PREVIEW_URL\`)
- \`public/media/\` — демо-видео и постеры (~60 МБ). Весь контент — плейсхолдеры (Pexels/Mixkit), клиенты вымышлены.
- \`.env\` — порт и переменные окружения
EOF

echo "▸ zipping"
mkdir -p dist
rm -f "dist/$NAME.zip"
# -y: symlink-и pnpm сохраняем как ссылки (относительные), иначе ломается разрешение модулей
( cd dist && zip -qry "$NAME.zip" "$NAME" -x '*.DS_Store' )
rm -rf "$OUT"
du -h "dist/$NAME.zip" | cut -f1 | xargs -I{} echo "✓ dist/$NAME.zip ({})"
