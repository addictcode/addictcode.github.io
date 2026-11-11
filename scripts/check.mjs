// Сквозная проверка собранного сайта в Chromium:
// главная (вступление, карта, выбор проекта узлом и строкой услуги), страницы проектов,
// горизонтальный скролл, оба демо, переключатель языка, режимы без WebGL и с prefers-reduced-motion.
// Запуск: npm run build && npm run check. Скриншоты ложатся в test-results/.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const PROJECTS = ['site', 'bot', 'crm', 'realtime', 'parsing']
const OUT = 'test-results'
const failures = []
const ok = (condition, message) => {
  console.log(`${condition ? '  ok  ' : ' FAIL '} ${message}`)
  if (!condition) failures.push(message)
}

await mkdir(OUT, { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

async function open(options = {}, path = '') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(site.url + path, { waitUntil: 'networkidle' })
  // карта грузится по первому действию посетителя: имитируем его
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
  return { context, page, errors }
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const toOffer = (page) => page.evaluate(() => document.getElementById('offer').scrollIntoView({ behavior: 'instant' }))

/* 1. Главная и страницы проектов */
for (const [name, viewport] of [
  ['desktop-1440', { width: 1440, height: 900 }],
  ['mobile-375', { width: 375, height: 740 }],
]) {
  console.log(`\n${name}`)
  const { context, page, errors } = await open({ viewport, deviceScaleFactor: 1, hasTouch: name.startsWith('mobile') })
  await page.waitForSelector('html[data-canvas]', { timeout: 30000 }).catch(() => {})
  ok((await page.locator('html[data-canvas]').count()) === 1, '3D-карта отрисовалась')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${name}-home-intro.png` })
  ok((await page.locator('main h1').count()) === 1, 'на главной один заголовок первого уровня')

  await toOffer(page)
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/${name}-home-map.png` })
  ok((await page.locator('.offer button').count()) === 8, 'в списке 8 услуг')
  ok((await page.locator('.card').count()) === 0, 'пока ничего не выбрано, карточки нет')

  // узел карты выбирает проект
  await page.locator('.hotspot[data-node="bot"]').click()
  await page.locator('.card[data-card="bot"]').waitFor({ timeout: 5000 }).catch(() => {})
  ok((await page.locator('.card[data-card="bot"]').count()) === 1, 'клик по узлу bot открыл карточку проекта')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/${name}-home-selected.png` })

  // строка услуги выбирает проект, кнопка «Закрыть» снимает выбор
  await page.locator('.offer button[data-offer="crm"]').first().click()
  ok((await page.locator('.card[data-card="crm"]').count()) === 1, 'строка услуги открыла карточку CRM')
  await page.locator('.card__close').click()
  ok((await page.locator('.card').count()) === 0, 'карточка закрывается')

  // из карточки на страницу проекта и обратно
  await page.locator('.offer button[data-offer="site"]').first().click()
  await page.locator('.card a.btn').click()
  await page.waitForSelector('article#site')
  ok(new URL(page.url()).hash === '#/site', 'карточка ведёт на страницу проекта')
  await page.locator('.back').click()
  await page.waitForSelector('#offer')
  ok((await page.locator('.card[data-card="site"]').count()) === 1, 'после возврата проект остаётся выбранным')
  ok((await overflow(page)) <= 0, 'главная: нет горизонтального скролла')

  for (const id of PROJECTS) {
    await page.goto(`${site.url}#/${id}`)
    await page.waitForSelector(`article#${id}`)
    await page.waitForTimeout(1600)
    await page.screenshot({ path: `${OUT}/${name}-project-${id}.png` })
    ok((await page.locator('main h1').count()) === 1 && (await overflow(page)) <= 0, `страница ${id}: заголовок на месте, горизонтального скролла нет`)
  }
  ok(errors.length === 0, `нет ошибок в консоли ${errors.join(' | ')}`)
  await context.close()
}

/* 2. Демо «Монитор объявлений» */
console.log('\nдемо: монитор объявлений')
{
  const { context, page } = await open({}, '#/bot')
  const demo = page.locator('[data-demo="monitor"]')
  await demo.scrollIntoViewIfNeeded()
  await demo.locator('[data-field="brand"]').selectOption({ index: 2 })
  await demo.locator('[data-field="size"]').selectOption({ index: 1 })
  await demo.locator('[data-field="price"]').selectOption({ index: 1 })
  await demo.locator('[data-action="monitor-toggle"]').click()
  await demo.locator('.monitor__state[data-state="done"]').waitFor({ timeout: 40000 })
  const checked = Number(await demo.locator('[data-counter="checked"]').textContent())
  const found = Number(await demo.locator('[data-counter="found"]').textContent())
  ok(checked === 36, `проверено ${checked} объявлений`)
  ok(found > 0 && found < checked, `найдено совпадений: ${found}`)
  ok((await demo.locator('.monitor__alerts .bubble').count()) > 0, 'уведомления бота появились')
  await demo.screenshot({ path: `${OUT}/demo-monitor.png` })
  await context.close()
}

/* 3. Демо «Заявка → бот → CRM → дашборд» */
console.log('\nдемо: заявка → бот → CRM → дашборд')
{
  const { context, page } = await open({}, '#/crm')
  const demo = page.locator('[data-demo="lead"]')
  await demo.scrollIntoViewIfNeeded()
  const before = Number(await demo.locator('[data-kpi="total"]').textContent())
  await demo.locator('input[name="name"]').fill('Тест Тестов')
  await demo.locator('select[name="need"]').selectOption({ index: 2 })
  await demo.locator('select[name="budget"]').selectOption({ index: 0 })
  await demo.locator('button[type="submit"]').click()
  await page.locator('[data-demo="lead"][data-stage="4"]').waitFor({ timeout: 10000 })
  ok((await demo.locator('.run__chat .bubble').count()) === 1, 'бот прислал сообщение')
  ok((await demo.locator('.run__chat').textContent()).includes('Тест Тестов'), 'в сообщении имя из формы')
  ok((await demo.locator('.run__crm tr.is-new').count()) === 1, 'в CRM появилась строка')
  const after = Number(await demo.locator('[data-kpi="total"]').textContent())
  ok(after === before + 1, `дашборд вырос: ${before} → ${after}`)
  await page.screenshot({ path: `${OUT}/demo-lead.png` })
  await context.close()
}

/* 4. Переключатель языка */
console.log('\nязык')
{
  const { context, page } = await open()
  const cyrillic = /[А-Яа-яЁё]/
  await page.locator('.langs button[lang="en"]').click()
  await page.waitForTimeout(300)
  // кириллица в EN-версии допустима только в примере раскладки («привод») и в каталоге схемы
  const leftovers = () =>
    page.evaluate(() => {
      const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT)
      const found = []
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent.trim()
        if (/[А-Яа-яЁё]/.test(text) && !walker.currentNode.parentElement.closest('.mock__grid') && !text.includes('привод')) found.push(text)
      }
      return found
    })
  let left = await leftovers()
  for (const id of PROJECTS) {
    await page.goto(`${site.url}#/${id}`)
    await page.waitForSelector(`article#${id}`)
    left = left.concat(await leftovers())
  }
  ok(left.length === 0, `в EN-версии не осталось русского текста ${left.slice(0, 5).join(' | ')}`)
  ok((await page.getAttribute('html', 'lang')) === 'en', 'html lang = en')
  ok(!cyrillic.test(await page.title()), 'заголовок вкладки на английском')
  await page.screenshot({ path: `${OUT}/lang-en-project.png` })
  await page.reload({ waitUntil: 'networkidle' })
  ok((await page.getAttribute('html', 'lang')) === 'en', 'выбор языка запомнился после перезагрузки')
  await context.close()
}

/* 5. Без WebGL и с prefers-reduced-motion */
for (const [name, options, init] of [
  ['reduced-motion', { reducedMotion: 'reduce' }, null],
  [
    'no-webgl',
    {},
    () => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
        return String(type).startsWith('webgl') ? null : original.call(this, type, ...rest)
      }
    },
  ],
]) {
  console.log(`\n${name}`)
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  if (init) await context.addInitScript(init)
  const page = await context.newPage()
  await page.goto(site.url, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
  await page.waitForTimeout(1500)
  ok((await page.locator('html[data-canvas]').count()) === 0, 'включилась статичная версия')
  ok((await page.locator('canvas').count()) === 0, 'canvas не создавался')
  const posterShown = (chapter) =>
    page
      .waitForFunction(
        (file) => {
          const img = document.querySelector('.stage__poster img')
          return img.complete && img.naturalWidth > 0 && img.currentSrc.includes(file)
        },
        `chapter-${chapter}`,
        { timeout: 5000 },
      )
      .then(() => true, () => false)
  // без карты проект выбирается строкой услуги
  await toOffer(page)
  await page.locator('.offer button[data-offer="parsing"]').first().click()
  ok((await page.locator('.card[data-card="parsing"]').count()) === 1, 'строка услуги открывает карточку и без карты')
  ok(await posterShown(5), 'показан кадр карты для выбранного проекта')
  await page.screenshot({ path: `${OUT}/${name}-home.png` })
  await page.goto(`${site.url}#/site`)
  await page.waitForSelector('article#site')
  ok(await posterShown(1), 'страница проекта: показан её кадр карты')
  ok((await page.locator('#site .facts > div').count()) > 0, 'страница проекта читается')
  await context.close()
}

await browser.close()
await site.close()
console.log(failures.length ? `\nПровалено проверок: ${failures.length}` : '\nВсе проверки пройдены')
process.exit(failures.length ? 1 : 0)
