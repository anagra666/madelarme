#!/usr/bin/env bash
# Статический экспорт для обычного хостинга (Plesk/cPanel/nginx без Node): pnpm package:static
#   PREVIEW_URL=https://madelarme.seoweb.kz pnpm package:static  → dist/madelarme-static-<date>.zip
# Заявки с форм на статике уходят текстом в WhatsApp (нет /api/lead). Индексация запрещена.
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d-%H%M)
NAME="madelarme-static-$STAMP"
OUT="dist/$NAME"
PREVIEW_URL="${PREVIEW_URL:-https://madelarme.seoweb.kz}"

# route handler (POST) не экспортируется — на время сборки убираем его из дерева
API_DIR="src/app/api"
API_TMP=".cache/api-aside"
restore() { if [ -d "$API_TMP" ]; then rm -rf "$API_DIR"; mv "$API_TMP" "$API_DIR"; fi; }
trap restore EXIT
mkdir -p .cache && rm -rf "$API_TMP" && mv "$API_DIR" "$API_TMP"

echo "▸ next build (static export, noindex)"
rm -rf out
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 NEXT_PUBLIC_NOINDEX=1 NEXT_PUBLIC_SITE_URL="$PREVIEW_URL" pnpm exec next build >/dev/null
restore
trap - EXIT

echo "▸ assembling $OUT"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -R out/. "$OUT/"
rm -f "$OUT/media/manifest.json"
cp scripts/static.htaccess "$OUT/.htaccess"

cat > "$OUT/README-DEPLOY.md" <<README
# MADELARME — статическая тестовая сборка ($STAMP)

Обычные HTML/CSS/JS-файлы — залить **содержимое этой папки** (включая скрытый .htaccess) в корень сайта (httpdocs / public_html / www). Node не нужен.
Собрано под адрес $PREVIEW_URL. **Индексация запрещена**: robots.txt (Disallow: /), meta robots на каждой странице, X-Robots-Tag через .htaccess.

Отличия от Node-версии: форма заявки открывает WhatsApp с готовым текстом (серверного /api/lead на статике нет); всё остальное идентично.

Проверка после заливки: $PREVIEW_URL/ , $PREVIEW_URL/work/ , $PREVIEW_URL/robots.txt (должно быть Disallow: /).
Если адреса вида /work/ отдают 403 или 404 — у хостинга выключен индексный файл index.html для папок (DirectoryIndex); в Plesk он включён по умолчанию.
README

echo "▸ zipping"
mkdir -p dist && rm -f "dist/$NAME.zip"
( cd "$OUT" && zip -qr "../$NAME.zip" . -x '*.DS_Store' )
rm -rf "$OUT"
du -h "dist/$NAME.zip" | cut -f1 | xargs -I{} echo "✓ dist/$NAME.zip ({})"
