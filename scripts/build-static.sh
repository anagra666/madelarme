#!/usr/bin/env bash
# Статический экспорт в out/ для тестового домена (noindex, заявки уходят в WhatsApp, API нет).
# Зовут scripts/package-static.sh (архив) и .github/workflows/deploy.yml (выкладка при push в main).
#   PREVIEW_URL=https://madelarme.seoweb.kz bash scripts/build-static.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PREVIEW_URL="${PREVIEW_URL:-https://madelarme.seoweb.kz}"

# route handler (POST) не экспортируется — на время сборки убираем его из дерева
API_DIR="src/app/api"
API_TMP=".cache/api-aside"
restore() { if [ -d "$API_TMP" ]; then rm -rf "$API_DIR"; mv "$API_TMP" "$API_DIR"; fi; }
trap restore EXIT
# прошлый запуск мог оборваться (kill, выключение) и оставить API в стороне — сначала возвращаем его
restore
mkdir -p .cache && rm -rf "$API_TMP" && mv "$API_DIR" "$API_TMP"

rm -rf out
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 NEXT_PUBLIC_NOINDEX=1 NEXT_PUBLIC_SITE_URL="$PREVIEW_URL" pnpm exec next build
restore
trap - EXIT

# служебный файл медиа-пайплайна на сайте не нужен
rm -f out/media/manifest.json
