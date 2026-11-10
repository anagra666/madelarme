# MADELARME — сайт видеографа Марии Волковой

Next.js 16 (App Router) · Tailwind v4 · Motion · Lenis. Концепт «Титры» — см. `docs/plan-v1.html` / `docs/MADELARME-plan-v1.pdf`.

## Запуск

```bash
pnpm install
pnpm media      # нарезать лупы, постеры и кадры из фильмов в .cache/sources (ffmpeg-static), ~5 мин, ~32 МБ в public/media
pnpm dev        # http://localhost:3000
```

`pnpm build && pnpm start` — продакшн. `pnpm typecheck`, `pnpm lint`, `pnpm media:check` (все ссылки на /media существуют), `pnpm content:check` (контент сходится с контрактом types.ts) — проверки.

Исходники для `pnpm media` — сами фильмы с YouTube-канала Madelarme, по одному файлу на ролик: `.cache/sources/{youtubeId}.mp4` (папка в .gitignore). Id — в поле `youtube` у элементов `scripts/media.manifest.json`; скачать заново, например, `yt-dlp -f "137/bv*[height<=1080][vcodec^=avc1]" -o ".cache/sources/%(id)s.%(ext)s" <id>`.

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

## Заявки

`POST /api/lead` шлёт в Telegram при `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` в `.env.local`, иначе пишет в консоль.
