# Выкладка на тестовый домен madelarme.seoweb.kz

Сайт лежит на офисном сервере SEOWEB (Mac mini, внутри Linux с Docker, перед всеми сайтами общий Caddy).
Выкладка идёт через git: достаточно запушить `main`.

## Как это работает

1. `git push origin main`.
2. GitHub Actions (`.github/workflows/deploy.yml`) проверяет контент, медиа и код, собирает статический сайт
   (`scripts/build-static.sh`, noindex, заявки уходят в WhatsApp) и кладёт готовые файлы в ветку `deploy`.
3. Сервер раз в минуту смотрит ветку `deploy` (таймер `madelarme-deploy.timer`). Новую сборку он раскладывает
   в `/srv/server/projects/madelarme/www/releases/<время>-<коммит>`, переключает на неё ссылку `www/current`
   и проверяет, что главная и разделы открываются. Если проверка не прошла, возвращает прошлую сборку.

От пуша до обновления сайта 2–4 минуты. Ход сборки: вкладка Actions в репозитории.
Сборка с ошибкой в проверках на сайт не попадает.

## Что где на сервере

| Что | Где |
| --- | --- |
| Файлы сайта | `/srv/server/projects/madelarme/www/releases/`, выложенная сборка: `www/current` |
| Контейнер | `madelarme-web-1` (nginx, `compose.yaml` и `nginx/` в папке проекта) |
| Журнал выкладок | `/srv/server/projects/madelarme/deployments/releases.log` |
| Сценарий выкладки | `/usr/local/lib/madelarme-deploy/madelarme-deploy.sh` |
| Ключ чтения репозитория | `/etc/madelarme-deploy/` (в GitHub: Settings → Deploy keys, только чтение) |
| Маршрут | блок `BEGIN/END MADELARME` в общем Caddyfile, правится только через `caddy-route.py` |

Хранятся три сборки: текущая и две прошлые. Одинаковые файлы (видео, картинки) между сборками не дублируются.

## Команды на сервере

Вход и правила сервера: `/srv/server/deployment/AGENTS.md`. Любое изменение только под `operation.lock`
(сценарий выкладки берёт его сам).

```sh
# журнал выкладок
sudo tail /srv/server/projects/madelarme/deployments/releases.log
# вернуть прошлую сборку (таймер её не перезапишет до следующего пуша)
sudo /usr/local/lib/madelarme-deploy/madelarme-deploy.sh rollback
# выложить текущую ветку deploy ещё раз
sudo FORCE=1 /usr/local/lib/madelarme-deploy/madelarme-deploy.sh
```

## Заголовки безопасности

Отдаёт nginx контейнера (`nginx/site.conf`): CSP с `frame-ancestors`, X-Frame-Options, nosniff, Referrer-Policy,
Permissions-Policy, HSTS и `X-Robots-Tag: noindex` (домен тестовый). Политика CSP задаётся в `src/lib/security.ts`:
при её изменении поправить строку в `nginx/site.conf` и переустановить конфиг на сервере.

## Переезд на боевой домен

Это отдельная работа: свой маршрут в Caddy, сборка без `NEXT_PUBLIC_NOINDEX`, убрать `X-Robots-Tag` из `site.conf`,
а для приёма заявок в Telegram нужен Node-режим вместо статики (`README.md`, «Заявки и переменные окружения»).

## Установка с нуля

`install.sh` (prepare → up → первая выкладка → enable), затем `caddy-route.py install`. Порядок и команды в шапке `install.sh`.
До 15.11.2026 домен отдавал охраняемый контейнер `turbo5-static-madelarme-1` (перенос с Plesk 3.11.2026, файлы закреплены
контрольной суммой, обновлять их на месте нельзя). `caddy-route.py remove` возвращает маршрут на него.
