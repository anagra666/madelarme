# Трейлер сайта (9:16, 32 с, 30 fps)

Моушн-ролик собран как HTML-композиция на одной GSAP-таймлайн (`index.html`) и рендерится покадрово через headless Chrome + ffmpeg.

1. `node capture.mjs` — снимает экраны сайта с телефона (нужен локальный статический сервер сайта на :3996, `out/` после `pnpm package:static`), затем склейка в `assets/home-long.jpg` и полосы шапки/липкой кнопки.
2. Скопировать лупы из `public/media/loops` в `assets/v/` (showreel-v, tau-toi-v, gorod-ne-spit-v/h, oyu-fest-v/h, pervyj-sneg-v, utro-zdes-v).
3. Отдать папку по http на :3995, `node render.mjs --stills 4.6,12.9` — контрольные кадры; `node render.mjs --all` — все кадры и mp4.

Просмотр в реальном времени: `index.html?play`. Сцены и тайминги — в конце `index.html` (S1 отсчет … S8 финал). Ролик без звука.
