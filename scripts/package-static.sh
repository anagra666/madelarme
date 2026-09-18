#!/usr/bin/env bash
# Статический экспорт для обычного хостинга (Plesk/cPanel/nginx без Node): pnpm package:static
#   PREVIEW_URL=https://madelarme.seoweb.kz pnpm package:static  → dist/madelarme-static-<date>.zip
# Заявки с форм на статике уходят текстом в WhatsApp (нет /api/lead). Индексация запрещена.
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d-%H%M)
NAME="madelarme-site-$STAMP"
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
# MADELARME — тестовая сборка ($STAMP)

Статические файлы. Распаковать архив в корень сайта (httpdocs / public_html) так, чтобы index.html и .htaccess лежали прямо в нём. Node не нужен, ничего настраивать не нужно.
Собрано под адрес $PREVIEW_URL. Индексация запрещена: robots.txt (Disallow: /), meta robots на каждой странице, X-Robots-Tag через .htaccess.

Форма заявки на этой сборке открывает WhatsApp с готовым текстом (серверной части нет).
Если после заливки сайт отдаёт 500 — удалите .htaccess (сайт и запрет индексации работают и без него).
README

echo "▸ zipping"
mkdir -p dist && rm -f "dist/$NAME.zip"
( cd "$OUT" && zip -qr "../$NAME.zip" . -x '*.DS_Store' )
rm -rf "$OUT"
du -h "dist/$NAME.zip" | cut -f1 | xargs -I{} echo "✓ dist/$NAME.zip ({})"
