# addictcode — «Одна заявка»

Сайт мини-студии разработки addictcode. Одна мысль: ни одна заявка не потеряется. Слово «заявка» из заголовка первого экрана при скролле становится карточкой и проходит путь сайт → Telegram-бот → CRM до «Оплачено». Ниже — короткий список работ и настоящая заявка в Telegram. Адрес: https://addictcode.github.io

Стек: Vite, React, TypeScript. Анимация по скроллу написана своим кодом, без библиотек и без three.js.

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
| Название студии, Telegram-ник, GitHub | `src/content/profile.ts`; название ещё стоит в `index.html` (title, og-теги, noscript) и в `meta.title` в `ru.ts` / `en.ts` |
| Ссылки проектов (код, демо) | `workLinks` в `src/content/profile.ts` |
| Тексты на русском и английском | `src/content/ru.ts`, `src/content/en.ts` |
| Услуги, цены, сроки | `services` в `ru.ts` / `en.ts`; порядок услуг совпадает с пунктами заявки `contact.needs` |
| Условия работы и частые вопросы | `terms` и `faq` в `ru.ts` / `en.ts` |
| Проекты в «Работах» | `works.items` в `ru.ts` / `en.ts`; схемы проектов — `src/components/Previews.tsx` |
| Путь заявки: тайминги и раскладка | `src/components/Journey.tsx` (ключи карточки, окна шагов) |
| Декорации пути: сайт, телефон, доска CRM | `src/components/scenes.tsx` |
| Цвета и шрифты | переменные в начале `src/styles/main.css` |

В компонентах текстов нет: всё лежит в `src/content/`. Структура описана типом `Content` в `src/content/types.ts`, поэтому забытый перевод не пройдёт проверку типов.

Статичная версия без анимации включается сама при `prefers-reduced-motion`, а вручную — параметром `?static`.

## OG-картинка и иконки

```bash
npm run build
npm run og         # первый экран → public/og.png, иконки из public/favicon.svg
npm run build
```

`og` снимает собранный сайт в Chromium через Playwright. Playwright берётся из проекта или из глобальной установки (`npm i -g playwright && npx playwright install chromium`).

## Проверка

```bash
npm run build
npm run check
node scripts/shots.mjs test-results/shots   # только скриншоты, чтобы посмотреть глазами
```

`check` открывает собранный сайт в Chromium и проверяет: путь заявки на 1440 и 375 px (скриншоты по точкам прогресса в `test-results/`), смену шагов, раздел «Работы», поиск по раскладке, сборку текста заявки для Telegram, переключатель языка, статичную версию, отсутствие горизонтального скролла и ошибок в консоли.

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

Репозиторий публичный. Два коммерческих кейса показаны без названий компаний, доменов и скриншотов; правила описаны в `CLAUDE.md` и `BRIEF.md`. Путь заявки на главной и схемы проектов нарисованы кодом: без выдуманных клиентов, цифр и скриншотов.
