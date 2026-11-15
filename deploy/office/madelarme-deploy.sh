#!/bin/bash
# Автовыкладка MADELARME на офисный сервер (тестовый домен madelarme.seoweb.kz).
# Забирает ветку deploy (готовая статика от GitHub Actions), раскладывает её в новую папку
# www/releases/<время>-<коммит> и переключает ссылку www/current. Прошлые сборки остаются для отката.
# Ставится в /usr/local/lib/madelarme-deploy/madelarme-deploy.sh (root), запускается таймером madelarme-deploy.timer.
#   Повторить ту же сборку:  sudo FORCE=1 /usr/local/lib/madelarme-deploy/madelarme-deploy.sh
#   Почему не забирает:      sudo cat /var/lib/madelarme-deploy/fetch-error (пусто или нет файла — всё в порядке)
#   Вернуть прошлую сборку:  sudo /usr/local/lib/madelarme-deploy/madelarme-deploy.sh rollback
set -euo pipefail
umask 022

P=/srv/server/projects/madelarme
WWW=$P/www
STATE=/var/lib/madelarme-deploy
REPO=$STATE/repo.git
REMOTE=git@github.com:anagra666/madelarme.git
LOG=$P/deployments/releases.log
CONTAINER=madelarme-web-1
KEEP=3                              # сколько сборок хранить: текущая и две прошлые
MAX_BYTES=$((300 * 1024 * 1024))    # сборка больше 300 МБ — ошибка, не выкладываем
# Без этих страниц сайт не работает — такую сборку не выкладываем
REQUIRED=(index.html 404.html robots.txt work/index.html formats/index.html pricing/index.html contact/index.html)
export GIT_SSH_COMMAND="ssh -F /dev/null -i /etc/madelarme-deploy/id_ed25519 -o IdentitiesOnly=yes \
 -o UserKnownHostsFile=/etc/madelarme-deploy/known_hosts -o GlobalKnownHostsFile=/dev/null \
 -o StrictHostKeyChecking=yes -o BatchMode=yes -o ConnectTimeout=20"

log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; echo "$*"; }

alive() { docker exec "$CONTAINER" wget -q -O /dev/null http://127.0.0.1:8080/__health; }

# Главная и разделы открываются, несуществующая страница отдаёт 404
check_site() {
  docker exec "$CONTAINER" sh -c '
    u=http://127.0.0.1:8080
    wget -q -O - "$u/" | grep -q "</html>" || exit 1
    for p in /work/ /formats/ /pricing/ /contact/ /robots.txt; do
      wget -q -O /dev/null "$u$p" || exit 1
    done
    if wget -q -O /dev/null "$u/net-takoi-stranicy-madelarme/" 2>/dev/null; then exit 1; fi
  '
}

current_name() { local t; t=$(readlink "$WWW/current" 2>/dev/null) || return 0; basename "$t"; }

switch_to() {  # $1 = имя папки в www/releases; подмена ссылки атомарная
  ln -sfn "releases/$1" "$WWW/current.new"
  mv -T "$WWW/current.new" "$WWW/current"
}

# Один запуск за раз (таймер и ручной запуск не пересекаются)
exec 8>"$STATE/run.lock"
flock -n 8 || exit 0

if [ "${1:-}" = rollback ]; then
  PREV=$(cat "$STATE/previous-release" 2>/dev/null || true)
  [ -n "$PREV" ] && [ -f "$WWW/releases/$PREV/index.html" ] || { echo "Прошлой сборки нет"; exit 1; }
  exec 9>/var/lib/server-backup/operation.lock
  flock -w 300 9 || { echo "operation.lock занят, повторите позже"; exit 75; }
  WAS=$(current_name)
  [ -n "$WAS" ] && [ "$WAS" != "$PREV" ] || { echo "Текущая сборка не определена или уже прошлая"; exit 1; }
  switch_to "$PREV"
  check_site || { switch_to "$WAS"; log "ROLLBACK FAILED: $PREV не прошла проверку, оставлена $WAS"; exit 1; }
  echo "$WAS" > "$STATE/previous-release"
  # эту сборку таймер сам не вернёт: ждём новый push или FORCE=1
  cp -f "$STATE/current" "$STATE/failed" 2>/dev/null || true
  log "ROLLBACK OK: $WAS -> $PREV"
  exit 0
fi

[ -d "$REPO" ] || git init -q --bare "$REPO"
# NOFETCH=1 — взять уже лежащую в $REPO ветку deploy (первая установка из git bundle, пока ключ не добавлен в GitHub)
if [ "${NOFETCH:-}" != 1 ]; then
  # GitHub недоступен или ключ не принят: не ошибка службы, просто ждём следующего запуска
  git -C "$REPO" fetch -q --no-tags "$REMOTE" +refs/heads/deploy:refs/heads/deploy 2> "$STATE/fetch-error" \
    || { echo "fetch failed: $(tail -n 1 "$STATE/fetch-error")"; exit 75; }
  rm -f "$STATE/fetch-error"
fi
NEW=$(git -C "$REPO" rev-parse --verify -q 'refs/heads/deploy^{commit}')
if [ "${FORCE:-}" != 1 ]; then
  [ "$NEW" != "$(cat "$STATE/current" 2>/dev/null)" ] || exit 0
  # Сборка, которая уже провалилась, сама не повторяется — ждём новый push или FORCE=1
  [ "$NEW" != "$(cat "$STATE/failed" 2>/dev/null)" ] || exit 0
fi
reject() { log "REJECT $NEW: $*"; echo "$NEW" > "$STATE/failed"; exit 1; }

# Только обычные файлы: симлинк или подмодуль из ветки deploy root-скрипт не раскладывает
BAD=$(git -C "$REPO" ls-tree -r --full-tree "$NEW" | awk '$1 != "100644" && $1 != "100755" && !bad {bad = $4} END {print bad}')
[ -z "$BAD" ] || reject "non-regular entry $BAD"
SIZE=$(git -C "$REPO" ls-tree -r -l --full-tree "$NEW" | awk '{s += $4} END {print s + 0}')
[ "$SIZE" -le "$MAX_BYTES" ] || reject "build is too large: $SIZE bytes"

exec 9>/var/lib/server-backup/operation.lock
flock -w 300 9 || { log "skip $NEW: operation.lock busy"; exit 75; }

# Если контейнер не отвечает ещё до выкладки, виновата не новая сборка — не выкладываем и не помечаем её
alive 2>/dev/null || { log "skip $NEW: container is not healthy before deploy"; exit 75; }

NAME="$(date -u +%Y%m%dT%H%M%SZ)-${NEW:0:7}"
DEST=$WWW/releases/$NAME
WAS=$(current_name)
[ ! -e "$DEST" ] || { log "skip $NEW: release $NAME already exists, retry in a second"; exit 75; }
TMP=$(mktemp -d "$STATE/export.XXXXXX")
DONE=0
MADE=0
cleanup() {
  rc=$?
  rm -rf "$TMP"
  if [ "$DONE" != 1 ]; then
    [ "$MADE" != 1 ] || rm -rf "$DEST"
    [ $rc -eq 0 ] || [ $rc -eq 1 ] || [ $rc -eq 75 ] || log "ABORT ${NEW:-?} rc=$rc"
  fi
}
trap cleanup EXIT

git -C "$REPO" archive "$NEW" | tar -x --no-same-owner --no-same-permissions -C "$TMP"
[ -z "$(find "$TMP" ! -type f ! -type d -print -quit)" ] || reject "non-regular file after export"
for f in "${REQUIRED[@]}"; do [ -s "$TMP/$f" ] || reject "missing $f"; done

# Одинаковые с текущей сборкой файлы (видео, картинки) не копируются, а берутся жёсткой ссылкой:
# сборка занимает на диске только изменившееся, а у медиа не меняются дата и ETag.
LINK=()
[ -z "$WAS" ] || [ ! -d "$WWW/releases/$WAS" ] || LINK=(--link-dest="$WWW/releases/$WAS/")
mkdir "$DEST"
MADE=1
rsync -rpc --chmod=D0755,F0644 "${LINK[@]}" "$TMP/" "$DEST/"

switch_to "$NAME"
if check_site; then
  DONE=1
  echo "$NEW" > "$STATE/current"
  rm -f "$STATE/failed"
  [ -z "$WAS" ] || echo "$WAS" > "$STATE/previous-release"
  log "OK $NEW $NAME $(git -C "$REPO" log -1 --format=%s "$NEW")"
  # Старые сборки сверх KEEP удаляем; текущую и прошлую не трогаем
  ls -1 "$WWW/releases" | sort | head -n -"$KEEP" | while read -r old; do
    [ "$old" = "$NAME" ] || [ "$old" = "$WAS" ] || rm -rf "${WWW:?}/releases/$old"
  done
else
  echo "$NEW" > "$STATE/failed"
  if [ -n "$WAS" ] && [ -d "$WWW/releases/$WAS" ]; then
    switch_to "$WAS"
    if check_site; then log "FAIL $NEW: проверка не прошла, возвращена сборка $WAS"
    else log "FAIL $NEW: проверка не прошла, возврат на $WAS тоже не прошёл — нужен ручной разбор"; fi
  else
    rm -f "$WWW/current"
    log "FAIL $NEW: первая сборка не прошла проверку"
  fi
  exit 1
fi
