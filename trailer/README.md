# Трейлер сайта (9:16, 32 с, 30 fps)

Моушн-ролик собран как HTML-композиция на одной GSAP-таймлайн (`index.html`) и рендерится покадрово через headless Chrome + ffmpeg.

1. `node capture.mjs` — снимает экраны сайта с телефона (нужен локальный статический сервер сайта на :3996, `out/` после `pnpm package:static`), затем `node stitch-home.mjs` — склейка в `assets/home-long.jpg` (780 px шириной) и полосы шапки `assets/header-strip.png` (780×112) и липкой кнопки `assets/sticky-strip.png` (780×114, с верхней линией).
2. Скопировать лупы из `public/media/loops` в `assets/v/` (все `*-v.mp4` и `*-h.mp4`: reel, oyu, cultural-love-story, red-bull-kick-off, n-n-wedding, red-bull-on-premise, modern-love-story, red-bull-annual-recap, red-bull-basement). В ролике заняты: `reel-v` (S2), `n-n-wedding-v` (S3, внутри букв), `oyu-v`, `cultural-love-story-v`, `red-bull-kick-off-v`, `n-n-wedding-v`, `red-bull-on-premise-v` (S5), `oyu-h` (S6).
3. Отдать папку по http на :3995, `node render.mjs --stills 4.6,7.5,12.3,14.2,18.3,24.6,27.8,30` — контрольные кадры в `stills/`; `node render.mjs --all` — все кадры в `frames/` и черновой `madelarme-trailer-9x16.mp4`.
4. Чистовые файлы из `frames/f%05d.jpg` (30 fps) в `../dist/trailer/`: `madelarme-trailer.mp4` (`-c:v libx264 -preset slow -crf 21 -maxrate 4.5M -bufsize 9M -tune grain -pix_fmt yuv420p -profile:v high -level 4.2 -movflags +faststart`), `madelarme-trailer-hq.mp4` (то же с `-crf 19 -maxrate 10M -bufsize 20M`), `poster.jpg` (кадр 5.2 с, `frames/f00156.jpg`).

Просмотр в реальном времени: `index.html?play`. Сцены и тайминги — в конце `index.html` (S1 отсчет … S8 финал). Ролик без звука.

Содержание (только реальные факты с сайта): S2 манифест «Снимаю заглавными.» на reel; S3 вордмарк, внутри букв свадьба Никиты и Нурай; S4 телефон: hero → индекс работ → карточка OYU → «Что снимаю» (до демо-фото в блоке «Привет, я Маша» прокрутка не доезжает, фото в ролик не брать); S5 индекс: OYU, Cultural Love Story, Red Bull Kick-Off, Wedding, Red Bull On Premise, счетчик [ 08 ]; S6 титры кейса OYU (Red Bull Kazakhstan, Aftermovie, Алматы · лето 2026, 12 000 гостей, 1:05); S7 полосы форматов, счетчик до 19; S8 «Давай снимать.».

Лупы в `index.html` указаны через `data-src` и при старте грузятся в blob: `python -m http.server` не отдает Range, у такого видео `seekable` пуст и перемотка молча стоит на первом кадре. Через blob перемотка работает на любом статическом сервере.

# Горизонтальный трейлер «Монтажка» (16:9, 46 с, 30 fps, со звуком)

Сюжет: сайт собирают в монтажной программе. Новый проект → импорт клипов в бин → клипы ложатся на дорожки → Play (бит 120 BPM) → окно программы вырывается на весь экран и становится главной сайта → бритвой режем клип «Работы» в такт, на каждом резе новый кейс → «Два экрана» (ноутбук с ховером по списку работ + телефон со скроллом) → кинотитры кейса поверх клипа в 2.39:1 → вкладка «Цвет» (до/после, колеса Lift/Gamma/Gain) → «Экспорт» с прогрессом и звонком «Готово» → финал «Давай снимать. @madelarme», шторка.

1. `node capture-desk.mjs` — снимает десктоп-экраны сайта 1440×900 (главная без видео для наложения, индекс работ с ховером по строкам) в `h/cap/`; готовые кадры положить в `h/` (`hero-novideo.png`, `index-0.jpg`, `index-r1..r4.jpg`).
2. В `h/v/` горизонтальные лупы 1280×720 (`public/media/loops/*-h.mp4`), в `h/p/` постеры `*-h.webp`, в `h/s/` кадры `public/media/stills/*.webp` (миниатюры для бина; `portrait*.webp` — демо-фото, в ролик не брать). Телефон в сцене «Два экрана» берет `assets/home-long.jpg` из вертикального трейлера.
3. Отдать папку `trailer/` по http на :3995: `node render-h.mjs --stills 13.3,23.5` — контрольные кадры, `node render-h.mjs --all` — все кадры в `frames-h/` (можно дорендерить отрезок: `--all --from 12.4 --to 15 --noenc`).
4. `node sound-h.mjs` — синтезирует звук `audio-h.wav` (48 кГц, стерео) с нуля: бочка, хэты, клэпы, бас и пэды в Am–F–C–G, клики интерфейса, печать имени проекта, щелчки бритвы, свуши, райзер, звонок; ревер Шредера, дакинг от бочки, нормализация к −1 dBFS. Все реплики привязаны к таймингам `h/index.html`.
5. Сборка в `../dist/trailer/`: `ffmpeg -framerate 30 -i frames-h/f%05d.jpg -i audio-h.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 21 -maxrate 4.5M -bufsize 9M -tune grain -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart madelarme-trailer-16x9.mp4`; HQ `madelarme-trailer-16x9-hq.mp4` — то же с `-crf 18 -maxrate 12M -bufsize 24M -b:a 256k`; `poster-16x9.jpg` — кадр 12.2 с (`frames-h/f00366.jpg`: монтажка, «Снимаю заглавными.» на Cultural Love Story).

Содержание (только факты из `src/content/*.json`, тайминги не трогать — на них сидит звук):
- Бин «12 клипов»: 9 постеров `h/p/` (reel и 8 работ) + 3 кадра `h/s/` (oyu-1, red-bull-kick-off-2, cultural-love-story-1).
- Программа: `reel-h`, «Снимаю / заглавными.», затем наложение `hero-novideo.png` (lighten).
- Бритва 16–20 с: OYU → Cultural Love Story → Red Bull Kick-Off → Wedding → Red Bull On Premise → Red Bull Annual Recap, подписи `[ 0N / 08 ] · формат · факт`. Каждому кейсу целая секунда одного плана: `data-start` = момент появления минус смещение внутри лупа (склейки лупов найдены `ffmpeg -vf "select='gt(scene,0.25)',showinfo"`). План кейса не должен повторять план шоурила, который шел под «Снимаю заглавными» (reel 0–6 с: флоурайд OYU, девушка в шапке на качелях из Cultural, машина у шины Kick-Off, лепестки Wedding): Cultural 0.35–1.35 (качели общим), Kick-Off 3.9–4.9 (дрифт в дыму), Wedding 3.55–4.55 (машут кольцами).
- «Два экрана»: ноутбук `index-0`/`index-r1..r4` (ховер OYU, Cultural Love Story, Red Bull Kick-Off, Wedding; точки из `h/cap/index-rows.json`, масштаб 1040/1440), телефон `assets/home-long.jpg` с настоящей шапкой `assets/header-strip.png`: hero → список работ (930) → карточка OYU (1790) → «Что снимаю» с ценами (4300). Ниже 5400 начинается демо-портрет, прокрутка туда не доезжает.
- Титры: Red Bull Kick-Off (Red Bull Kazakhstan · Бренд-ивент и активация · ASP Arena, Алматы · 2026 · первый в Казахстане Red Bull Car Park Drift · Репортаж 1:53) поверх `red-bull-kick-off-h`. Ролей не придумывать.
- Цвет: `n-n-wedding-h`, шторка справа налево (слева «До», справа теплый грейд «После»; про log и LUT на сайте ничего нет, в ролик не писать), «Снимаю одна. / Монтирую сама.».
- Экспорт «8 работ · 19 форматов · цены · Маша», финал «Свадьбы · Ивенты · Бренды · Алматы».

Грабли:
- Не фейдить `opacity` у слоя, внутри которого картинка с `mix-blend-mode`, — слой изолирует наложение и на время фейда чернит видео под ним. Фейдить саму картинку.
- `python -m http.server` не отдает Range: у видео `seekable` пуст и перемотка молча стоит на первых секундах. Поэтому лупы указаны через `data-src` и при старте грузятся в blob.
- Видео, которое только что стало видимым, Chrome показывает со старым кадром даже после `seeked`. Поэтому `__seek` перематывает все видео (и скрытые), ждет `seeked` + `requestVideoFrameCallback`, а только что проявившиеся дергает второй перемоткой.
