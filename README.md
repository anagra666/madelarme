# MADELARME — сайт видеографа Марии Волковой

Next.js 16 (App Router) · Tailwind v4 · Motion · Lenis. Концепт «Титры» — см. `docs/plan-v1.html` / `docs/MADELARME-plan-v1.pdf`.

## Запуск

```bash
pnpm install
pnpm media      # скачать и перекодировать демо-лупы/постеры (ffmpeg-static), ~5 мин, ~60 МБ в public/media
pnpm dev        # http://localhost:3000
```

`pnpm build && pnpm start` — продакшн. `pnpm typecheck`, `pnpm lint`, `node scripts/check-media.mjs` — проверки.

## Где что

- `src/content/*.json` — весь контент (кейсы, форматы, цены, FAQ, reels, настройки). Схема — `src/content/types.ts`, это контракт будущей админки (Payload CMS).
- `src/lib/content.ts` — выборки; `src/lib/links.ts` — WhatsApp/Telegram deep-links с предзаполнением; `src/lib/settings.ts`.
- `src/components/media/CinemaVideo.tsx` — единственный видео-примитив (постер SSR, один луп на телефоне, fallback при блокировке автоплея).
- `src/components/home/*` — секции главной; `src/components/work/*` — работы и кейс; `src/components/pages/*` — остальные страницы; `src/components/layout/*` — шапка, меню, sticky-CTA, футер, панель контактов.
- `scripts/media.mjs` + `scripts/media.manifest.json` — медиа-пайплайн (Pexels/Mixkit/Coverr → 720p H.264 ≤4 МБ + WebP).
- `docs/BUILD-BRIEF.md` — правила разработки; `docs/research/` — ресёрч.

## Демо-контент

Все кейсы помечены `isPlaceholder: true` (клиенты вымышлены, видео — стоки), скрываются тумблером `toggles.showPlaceholders` в `settings.json`. Реальные ролики Марии (OYU Fest, N&N) открываются в плеере с YouTube.

## Заявки

`POST /api/lead` шлёт в Telegram при `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` в `.env.local`, иначе пишет в консоль.
