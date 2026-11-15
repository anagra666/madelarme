#!/bin/bash
# Разовая установка выкладки MADELARME на офисный сервер. Запускать на сервере от root из папки с этими файлами:
#   sudo -n flock /var/lib/server-backup/operation.lock ./install.sh prepare   папки, конфиги, ключ для GitHub
#   sudo -n flock /var/lib/server-backup/operation.lock ./install.sh up        контейнер сайта (пока без маршрута)
#                                                                              после правки nginx/*.conf: снова prepare и up
#   sudo -n /usr/local/lib/madelarme-deploy/madelarme-deploy.sh                первая выкладка (блокировку берёт сам)
#   sudo -n flock /var/lib/server-backup/operation.lock ./install.sh enable    таймер автовыкладки
# Маршрут в общем Caddy переключается отдельно: caddy-route.py install.
set -euo pipefail
umask 022
[ "$(id -u)" = 0 ] || { echo "нужен root"; exit 1; }
cd "$(dirname "$0")"

P=/srv/server/projects/madelarme
KEYS=/etc/madelarme-deploy
STATE=/var/lib/madelarme-deploy
LIB=/usr/local/lib/madelarme-deploy

case "${1:-}" in
  prepare)
    install -d -o root -g root -m 0755 "$P" "$P/www" "$P/www/releases" "$P/nginx" "$P/deployments"
    install -d -o root -g root -m 0700 "$KEYS" "$STATE" "$LIB"
    # compose и конфиги: root 0644, иначе ночная очистка образов падает для всего сервера
    install -o root -g root -m 0644 compose.yaml "$P/compose.yaml"
    install -o root -g root -m 0644 nginx/nginx.conf nginx/site.conf "$P/nginx/"
    install -o root -g root -m 0755 caddy-route.py "$P/deployments/caddy-route.py"
    install -o root -g root -m 0755 madelarme-deploy.sh "$LIB/madelarme-deploy.sh"
    install -o root -g root -m 0644 madelarme-deploy.service madelarme-deploy.timer /etc/systemd/system/
    [ -f "$KEYS/id_ed25519" ] || ssh-keygen -q -t ed25519 -N '' -C madelarme-deploy@office-server -f "$KEYS/id_ed25519"
    # отпечаток github.com берём у уже проверенной выкладки sodex на этом же сервере
    [ -f "$KEYS/known_hosts" ] || install -o root -g root -m 0644 /etc/sodex-deploy/known_hosts "$KEYS/known_hosts"
    docker compose -f "$P/compose.yaml" config -q
    systemctl daemon-reload
    echo "Ключ для GitHub (Settings -> Deploy keys, только чтение):"
    cat "$KEYS/id_ed25519.pub"
    ;;
  up)
    docker compose -f "$P/compose.yaml" up -d
    for _ in $(seq 1 30); do
      [ "$(docker inspect madelarme-web-1 --format '{{.State.Health.Status}}')" = healthy ] && break
      sleep 2
    done
    [ "$(docker inspect madelarme-web-1 --format '{{.State.Health.Status}}')" = healthy ] || { echo "контейнер не стал healthy"; exit 1; }
    # конфиг мог измениться при уже работающем контейнере: проверяем и перечитываем
    docker exec madelarme-web-1 nginx -t -q -c /etc/nginx/madelarme/nginx.conf
    docker exec madelarme-web-1 nginx -s reload -c /etc/nginx/madelarme/nginx.conf
    echo healthy
    ;;
  enable)
    systemctl enable --now madelarme-deploy.timer
    systemctl list-timers --no-pager madelarme-deploy.timer
    ;;
  *) echo "prepare | up | enable"; exit 1 ;;
esac
