# MADELARME — сайт видеографа Марии Волковой

Next.js 16 (App Router) · Tailwind v4 · Motion · Lenis. Концепт «Титры» — см. `docs/plan-v1.html` / `docs/MADELARME-plan-v1.pdf`.

## Запуск

```bash
pnpm install
pnpm media      # нарезать лупы, постеры и кадры из фильмов в .cache/sources (ffmpeg-static), ~5 мин, ~32 МБ в public/media
pnpm dev        # http://localhost:3000
```

`pnpm build && pnpm start` — продакшн. `pnpm typecheck`, `pnpm lint`, `pnpm media:check` (все ссылки на /media существуют), `pnpm content:check` (контент сходится с контрактом types.ts) — проверки.

Готовые файлы `public/media` лежат в git: из них сайт собирается на GitHub, поэтому после `pnpm media` результат нужно закоммитить. Исходники для `pnpm media` — сами фильмы с YouTube-канала Madelarme, по одному файлу на ролик: `.cache/sources/{youtubeId}.mp4` (папка в .gitignore). Id — в поле `youtube` у элементов `scripts/media.manifest.json`; скачать заново, например, `yt-dlp -f "137/bv*[height<=1080][vcodec^=avc1]" -o ".cache/sources/%(id)s.%(ext)s" <id>`.

## Выкладка

Тестовый домен https://madelarme.seoweb.kz обновляется сам после `git push origin main` (сборка на GitHub, сервер забирает готовые файлы). Подробности, журнал и откат: [deploy/office/README.md](deploy/office/README.md). Архив для обычного хостинга по-прежнему собирает `pnpm package:static`.

## Где что

- `src/content/*.json` — весь контент (кейсы, форматы, цены, FAQ, reels, настройки). Схема — `src/content/types.ts`, это контракт будущей админки (Payload CMS).
- `src/lib/content.ts` — выборки; `src/lib/links.ts` — WhatsApp/Telegram deep-links с предзаполнением; `src/lib/settings.ts`.
- `src/components/media/CinemaVideo.tsx` — единственный видео-примитив (постер SSR, один луп на телефоне, fallback при блокировке автоплея).
- `src/components/home/*` — секции главной; `src/components/work/*` — работы и кейс; `src/components/pages/*` — остальные страницы; `src/components/layout/*` — шапка, меню, sticky-CTA, футер, панель контактов.
- `scripts/media.mjs` + `scripts/media.manifest.json` — медиа-пайплайн (фильмы из .cache/sources → лупы 720p H.264 ≤4 МБ + WebP-постеры и кадры; `montage` — шоурил-луп из нескольких фильмов).
- `docs/BUILD-BRIEF.md` — правила разработки; `docs/research/` — ресёрч.

## Работы и демо-контент

8 кейсов — реальные работы Марии (таблица клиента: название, описание, ссылка на YouTube). В кейсе только то, что дал клиент: описание разложено на логлайн, «Задачу» и «В кадре», город, площадка и год — только где названы в описании или в названии ролика. Чего нет (съёмка, сроки сдачи, титры), не выдумываем: поля необязательные и на сайте не выводятся. Полный фильм играет с YouTube в плеере сайта (провайдер `youtube`), лупы, постеры и кадры нарезаны из самих фильмов.

Цены, условия, форматы и тексты «Обо мне» — из ответов Маши (ноябрь 2026): тарифы по времени и поштучно (`src/content/pricing.json`, `Format.priceModel`), доплаты +10%, сдача за 2 недели. Демо осталось только фото на «Обо мне» (`toggles.aboutIsDemo`: подпись «фото — демо», счётчики скрыты). Занятость — `settings.availability` + `toggles.showAvailability` (выключено, пока нет дат; список старше 30 дней сам скрывается). `toggles.showPlaceholders` выключен: демо-кейсы и демо-reels удалены, отзывов пока нет.

## Заявки и переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните. `POST /api/lead` шлёт заявку в Telegram при `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Без них в консоль заявка пишется только при `pnpm dev`; на продакшн-сборке сервер отвечает 503 `delivery_unconfigured`, форма показывает «Не отправилось» и кнопку WhatsApp с текстом заявки (тихо терять заявки нельзя).

Защита маршрута: принимает только `application/json` с того же домена (Origin = Host / X-Forwarded-Host), тело до 64 КБ, поля проверяются и чистятся от управляющих символов, подпись формата сверяется со списком из `getFormatChips()`. Спам: скрытое поле формы (`hp_note`, в теле запроса `website`) - 400 `rejected`; отправка быстрее 3 с (`elapsed`) - 400 `too_fast`; в обоих случаях форма предлагает WhatsApp, так что ложное срабатывание не теряет заявку; лимит 5 заявок в минуту на IP и 20 в минуту на весь сайт. IP не уходит ни в Telegram, ни в лог.

Лимит по IP работает только при `TRUST_PROXY=1`: ставьте его, когда перед Node стоит ваш прокси, который перезаписывает `X-Real-IP` (в preview-сборке nginx так и делает). Без этого все запросы делят одну корзину, 5 в минуту на весь сайт.

`NEXT_PUBLIC_SITE_URL` задается без завершающего слэша (лишний слэш срезается, пустое значение возвращает `https://madelarme.kz`); общий источник - `src/lib/site.ts`.

## Заголовки безопасности

Политика одна на все режимы: `src/lib/security.ts` (CSP без nonce, потому что страницы пререндерятся: `'unsafe-inline'` для скриптов Next; iframe только с `youtube-nocookie.com`). Если кейсы начнут играть с Vimeo, Bunny или Kinescope, добавьте их домены в `FRAME_SRC`, иначе плеер молча не загрузится.

- Node-режим (`next start`, standalone): заголовки отдает `next.config.ts` - CSP, `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (кроме dev). `X-Robots-Tag` остается на превью-домене.
- Статический экспорт: `headers()` Next не применяет. Заголовки лежат в `scripts/static.htaccess` (работают, когда файлы отдает Apache) и дублируются в `<meta>` (CSP без `frame-ancestors`, referrer) прямо в HTML.
- Preview-сборка Node: `package-preview.sh` кладет `madelarme-headers.conf` для nginx и подключает его в статические location.

### Заголовки безопасности на хостинге

Plesk с nginx/Caddy игнорирует `.htaccess` для статики. Впишите это в Домен -> Настройки Apache и nginx -> «Дополнительные директивы nginx»:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" always;
add_header Strict-Transport-Security "max-age=31536000" always;
# только для тестового домена (на боевом убрать):
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
```

Если хостинг уже шлёт `X-Content-Type-Options` или `X-Robots-Tag`, не дублируйте эти строки. Если TLS заканчивается на Caddy, HSTS можно задать там (`header Strict-Transport-Security "max-age=31536000"`). Location с собственным `add_header` не наследует директивы сервера: проверьте командой

```bash
curl -sI https://ДОМЕН/ | grep -iE 'content-security|x-frame|referrer|strict-transport'
curl -sI https://ДОМЕН/_next/static/chunks/<любой>.js | grep -i nosniff
```
