# MADELARME — бриф для сборки (прототип v1)

Сайт видеографа Марии Волковой (@madelarme, Алматы). Концепт «Титры»: типографический индекс + видео по действию + личный голос. Полный план: `docs/plan-v1.html` (разделы 04–12). Этот файл — правила для всех, кто пишет код.

## Стек и запуск
- Next.js 16.3 (App Router, Turbopack, **async `params`**: `const { slug } = await params`), React 19, TypeScript strict.
- Tailwind v4 — токены в `src/app/globals.css` (`@theme`), никаких tailwind.config.
- Motion 13 (`motion/react`) — единственный движок анимаций в мобильной сборке. GSAP + ScrollTrigger — только `dynamic import` для десктопных pin-секций. Lenis уже подключён глобально (`SmoothScroll`, только `pointer: fine`).
- Иконки: `lucide-react`. Классы: `cn()` из `@/lib/utils` (clsx).
- **Не запускать** `next dev` / `next build` — dev-сервер уже поднят на :3033 (Turbopack-кэш общий). Проверка: `pnpm typecheck` и `pnpm exec eslint <файлы>`.
- Шрифты подключены в `layout.tsx`: `--font-disp` (Sofia Sans Extra Condensed 800), `--font-body` (Inter Tight), `--font-mono` (Roboto Mono).

## Токены (globals.css)
Цвета: `ink` #0E0D0C (фон), `ink-2` поверхности, `paper` #F3EEE6, `paper-2`, `milk` #ECE7DF (текст на тёмном), `signal` #FF4D2E (единственный акцент — только интерактив, REC, подпись), `meta` #8F877D, `rule` #2B2724. Tailwind: `bg-ink text-milk border-rule text-signal bg-paper`…
Утилиты: `disp` (дисплейный капс, line-height .86), `mono` / `mono-sm` (моно-капс с tracking), шкала `text-h1 text-h2 text-h3 text-row`; `paper` (секция-перевёртыш: внутри неё `text-milk` = чернила, `text-meta`, `border-rule` автоматически перекрашиваются), `grain` (зерно на тёмном), `scrim-b` (градиент под текстом на видео), `cropmarks` (метки в углах бумажной секции), `rail` (горизонтальный scroll-snap с отступом 24px), `px-gutter` (`--spacing-gutter`), `ease-out-expo`.
Правила: radius 0 везде; тени не используем; один движущийся эффект на секцию; акцент — только на том, что можно нажать.

## Готовые примитивы — использовать, не дублировать
- `CinemaVideo` (`@/components/media/CinemaVideo`) — ЕДИНСТВЕННЫЙ способ показывать видео-лупы. Props: `loop: MediaLoop`, `mode: "visible" | "hover" | "manual"`, `playing`, `priority` (hero), `orientation: "auto"|"h"|"v"`, `pauseButton`, `focus`, `className` (задаёт размер: `absolute inset-0` или `aspect-video`). Сам решает постер/ориентацию, лимит играющих (1 на тач), fallback при блокировке автоплея, saveData.
- `Reveal` + `Line`, `Fade` (`@/components/ui/Reveal`) — появление строк заголовков.
- `Marquee` (`@/components/ui/Marquee`) — бегущая строка.
- `Button` (`@/components/ui/Button`) — variant `signal|outline|ghost|paper`, size `md|lg|xl`, `href` → Link/a.
- `Section`, `Eyebrow`, `Container` (`@/components/ui/Section`).
- Хуки `@/lib/hooks`: `useMediaQuery`, `useFinePointer`, `useAlmatyTime`, `useScrollLock`.
- Контент `@/lib/content`: `settings`, `getCases({featured, format, mood})`, `getCase(slug)`, `getAdjacentCases`, `getFormats(group?)`, `getFormat`, `countByFormat`, `formatGroups`, `moods`, `getPricing()`, `getFaq(scope)`, `getReels()`, `getClients()`, `getTestimonials()`, `formatPrice(n)`.
- Ссылки `@/lib/links`: `waLink(text?)`, `tgLink(text?)`, `igDmLink()`, `igLink()`, `telLink()`, `prefill(kind, title)` — kind: `home|case|format|pricing|contact`.
- Типы контента: `src/content/types.ts` — это контракт будущей админки, менять только по необходимости и с комментарием.

## Общие правила вёрстки
- Mobile-first от 390px, проверять 360 и 430; десктоп от 1024. Hero = `h-svh` (не vh). H1 и CTA рендерятся сервером (никакого `opacity:0` до гидратации — anti-pattern текущего сайта).
- Server Components по умолчанию; `"use client"` только там, где есть состояние/эффекты. Клиентские компоненты — маленькие листья.
- Все горизонтальные ленты на телефоне — `rail` (нативный scroll-snap), следующая карточка видна полукадром, ≤8 элементов. Никаких пинов/GSAP на тач; hover-приёмы имеют tap-эквивалент.
- Одновременно играет ≤1 видео на тач (CinemaVideo это делает сам). Не более 8 `<CinemaVideo>` в одной секции.
- Tap-цели ≥44px, CTA 56px. Названия кейсов ≤14 символов в одну строку (`whitespace-nowrap` + `clamp`).
- Текст в DOM целый (split — только через обёртки `<Line>`). Все медиа с заданным aspect-ratio (CLS 0).
- Демо-контент: если `isPlaceholder` — маленькая моно-плашка «ДЕМО-КОНТЕНТ» на странице кейса/reel (не на главной).
- Копирайт: от первого лица, коротко, без «мы». Названия секций капсом дисплейным шрифтом.
- Доступность: `aria-label` у иконочных кнопок, `Esc` закрывает оверлеи, фокус возвращается, `prefers-reduced-motion` учтён (Reveal/Marquee/CinemaVideo уже учитывают).

## Карта страниц и владельцы файлов (агенты работают параллельно — не трогать чужие файлы)
| Область | Файлы |
|---|---|
| layout | `src/components/layout/{Header,MenuOverlay,StickyCTA,Footer,ContactPanel}.tsx` |
| hero | `src/components/home/{Hero,ManifestMarquee}.tsx` |
| index+reels | `src/components/home/{WorkIndex,ReelsRow}.tsx`, `src/components/media/ReelsStory.tsx` |
| home-rest | `src/components/home/{StackedCases,FormatsList,AboutTeaser,ClientsQuote,PricingTeaser,FinalCTA}.tsx` |
| work | `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx`, `src/components/work/*`, `src/components/media/Player.tsx` |
| pages | `src/app/{formats,formats/[slug],pricing,about,reels,contact,showreel,privacy}/page.tsx`, `src/app/not-found.tsx`, `src/components/pages/*` |
| content | `src/content/*.json` (кроме types.ts), `scripts/media.manifest.json`, `public/media/*` |

Главная `src/app/page.tsx` собирается интегратором из секций home/* — экспортируйте default-компоненты без пропсов (данные берите из `@/lib/content` внутри).

## Приёмка (что проверяет интегратор)
`pnpm typecheck` чистый; eslint без ошибок; страница выглядит по плану на 390 и 1440; нет YouTube-iframe вне плеера; нет `opacity-0` на H1; sticky-CTA не перекрывает контент (padding-bottom секций); клавиатура: Tab/Esc работают в оверлеях.
