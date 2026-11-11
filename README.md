# Портфолио «Кубики»

Личный сайт Дмитрия Шайбакова: одна фигура из 216 кубиков, которая на скролле пересобирается под каждый проект. Адрес: https://addictcode.github.io

Стек: Vite, React, TypeScript, three.js через `@react-three/fiber` и `@react-three/drei`, GSAP ScrollTrigger, Lenis.

## Локальный запуск

Нужен Node.js 22 или новее.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # проверка типов и сборка в dist/
npm run preview    # посмотреть собранный сайт
npm run lint
```

## Что где менять

| Что | Где |
|---|---|
| Telegram-ник | `src/content/profile.ts`, поле `telegram` (сейчас `CHANGE_ME`). Ссылка `https://t.me/<ник>` собирается из него |
| GitHub и ссылки на проекты | `src/content/profile.ts` |
| Тексты на русском | `src/content/ru.ts` |
| Тексты на английском | `src/content/en.ts` |
| Выдуманные данные демо | `src/content/demoData.ts` |
| Заголовок и описание для соцсетей | `index.html` (og-теги) и `meta` в `ru.ts` / `en.ts` |
| Цвета и шрифты | переменные в начале `src/styles/main.css` |
| Формы, в которые складываются кубики | `src/scene/formations.ts` |
| Имя и подпись в шапке и на первом экране | `hero` в `ru.ts` / `en.ts` |

В компонентах текстов нет: всё лежит в `src/content/`. Структура описана типом `Content` в `src/content/types.ts`, поэтому забытый перевод не пройдёт проверку типов.

## Картинки и статичные кадры

Исходники лежат в `assets-src/`, в сборку попадают сжатые копии из `public/`.

```bash
npm run images     # assets-src/ → public/img/*.webp и *.avif
npm run build
npm run posters    # кадры фигуры для каждой главы → public/posters/
npm run og         # OG-картинка и PNG-иконки → public/
npm run build
```

`posters` и `og` снимают собранный сайт в Chromium через Playwright, поэтому перед ними нужна свежая сборка, а после них ещё одна. Запускать их нужно, если менялась 3D-сцена или тексты первого экрана. Playwright берётся из проекта или из глобальной установки (`npm i -g playwright && npx playwright install chromium`).

Постеры — это статичная версия сайта. Её видят посетители без WebGL, на слабых устройствах и с включённым `prefers-reduced-motion`; текст у неё тот же. Эти же кадры показываются всем до первого действия: чанк с three.js подгружается при первом скролле, касании или движении мыши. Принудительно включить режимы можно параметрами `?static` (только постеры) и `?eager` (сцена сразу после загрузки).

## Проверка

```bash
npm run build
npm run check
```

`check` открывает собранный сайт в Chromium и проверяет: скриншоты 1440 и 375 px на каждой главе (папка `test-results/`), отсутствие горизонтального скролла, сценарии обоих демо, переключатель языка, режимы без WebGL и с `prefers-reduced-motion`.

## Публикация на GitHub Pages

Один раз: в репозитории открыть **Settings → Pages → Build and deployment → Source** и выбрать **GitHub Actions**.

Дальше при каждом пуше в `main` workflow `.github/workflows/deploy.yml` запускает линтер, собирает сайт и публикует `dist/` через `actions/deploy-pages`. Ход публикации виден на вкладке **Actions**. Запустить вручную: **Actions → Deploy to GitHub Pages → Run workflow**.

Репозиторий называется `addictcode.github.io`, поэтому сайт живёт в корне домена и в `vite.config.ts` стоит `base: '/'`.

## Свой домен

1. Положить файл `public/CNAME` с одной строкой — доменом, например `example.com`.
2. У регистратора домена:
   - для поддомена (`www.example.com`): запись `CNAME` на `addictcode.github.io`;
   - для корневого домена (`example.com`): четыре записи `A` на `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. В **Settings → Pages → Custom domain** указать домен, дождаться проверки DNS и включить **Enforce HTTPS**.
4. Заменить `https://addictcode.github.io` на новый адрес в `index.html` (canonical, `og:url`, `og:image`, `twitter:image`).

`base: '/'` менять не нужно.

## Запасной вариант: Cloudflare Pages

1. В панели Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, выбрать этот репозиторий.
2. Настройки сборки: Framework preset — **Vite** (или None), Build command — `npm run build`, Build output directory — `dist`.
3. В переменных окружения задать `NODE_VERSION` = `22`.
4. После первой сборки сайт доступен на `<проект>.pages.dev`. Свой домен подключается во вкладке **Custom domains**.

Код менять не нужно: сборка статическая, `base: '/'` подходит и для Cloudflare. Если сайт переезжает совсем, замените адрес в `index.html`, как в пункте 4 выше.

## Конфиденциальность

Репозиторий публичный. Два коммерческих кейса показаны без названий компаний, доменов и скриншотов; правила описаны в `CLAUDE.md` и `BRIEF.md`. Все демо работают в браузере на выдуманных данных и подписаны как демо.
