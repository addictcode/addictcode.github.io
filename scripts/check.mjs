// Сквозная проверка собранного сайта в Chromium:
// скриншоты 1440 и 375 px на каждой главе, горизонтальный скролл,
// оба демо, переключатель языка, режимы без WebGL и с prefers-reduced-motion.
// Запуск: npm run build && npm run check. Скриншоты ложатся в test-results/.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const CHAPTERS = ['intro', 'site', 'bot', 'crm', 'realtime', 'parsing', 'contact']
const OUT = 'test-results'
const failures = []
const ok = (condition, message) => {
  console.log(`${condition ? '  ok  ' : ' FAIL '} ${message}`)
  if (!condition) failures.push(message)
}

await mkdir(OUT, { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

async function open(options = {}, query = '') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(site.url + query, { waitUntil: 'networkidle' })
  // сцена грузится по первому действию посетителя: имитируем его
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
  return { context, page, errors }
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const scrollToChapter = (page, id) =>
  page.evaluate((target) => {
    const top = document.getElementById(target).getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top)
  }, id)

/* 1. Скриншоты глав и горизонтальный скролл */
for (const [name, viewport] of [
  ['desktop-1440', { width: 1440, height: 900 }],
  ['mobile-375', { width: 375, height: 740 }],
]) {
  console.log(`\n${name}`)
  const { context, page, errors } = await open({ viewport, deviceScaleFactor: 1, hasTouch: name.startsWith('mobile') })
  await page.waitForSelector('html[data-canvas]', { timeout: 30000 }).catch(() => {})
  ok((await page.locator('html[data-canvas]').count()) === 1, '3D-сцена отрисовалась')
  for (const [index, id] of CHAPTERS.entries()) {
    await scrollToChapter(page, id)
    await page.waitForTimeout(1300)
    await page.screenshot({ path: `${OUT}/${name}-${index}-${id}.png` })
    if (name.startsWith('desktop')) {
      const current = (await page.locator('.rail a[aria-current] .rail__no').textContent()).trim()
      ok(current === String(index).padStart(2, '0'), `глава ${index} (${id}): в навигации активна ${current}`)
    }
  }
  const visible = await page.locator(`#${CHAPTERS[CHAPTERS.length - 1]} .plate`).isVisible()
  ok(visible, 'последний экран виден после прокрутки')
  await page.locator('#contact [data-open="contact"]').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/${name}-sheet.png` })
  await page.locator('.sheet__close').click()
  ok((await overflow(page)) <= 0, 'нет горизонтального скролла')
  ok(errors.length === 0, `нет ошибок в консоли ${errors.join(' | ')}`)
  await context.close()
}

/* 2. Демо «Монитор объявлений» */
console.log('\nдемо: монитор объявлений')
{
  const { context, page } = await open()
  await scrollToChapter(page, 'bot')
  await page.waitForTimeout(1500)
  await page.locator('#bot [data-open="bot"]').click()
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
  const { context, page } = await open()
  await page.locator('#intro [data-open="lead"]').click()
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
  await demo.screenshot({ path: `${OUT}/demo-lead.png` })
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
  const leftovers = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT)
    const found = []
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim()
      if (/[А-Яа-яЁё]/.test(text) && !walker.currentNode.parentElement.closest('.mock__grid')) found.push(text)
    }
    return found
  })
  const allowed = leftovers.filter((text) => !text.includes('привод'))
  ok(allowed.length === 0, `в EN-версии не осталось русского текста ${allowed.slice(0, 5).join(' | ')}`)
  ok((await page.getAttribute('html', 'lang')) === 'en', 'html lang = en')
  ok(!cyrillic.test(await page.title()), 'заголовок вкладки на английском')
  await scrollToChapter(page, 'site')
  await page.waitForTimeout(1500)
  await page.locator('#site [data-open="site"]').click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/lang-en-sheet.png` })
  await page.locator('.sheet__close').click()
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
  ok((await page.locator('html[data-live]').count()) === 0, 'включилась статичная версия')
  ok((await page.locator('canvas').count()) === 0, 'canvas не создавался')
  ok((await page.locator('main h2').count()) === 6 && (await page.locator('main h1').count()) === 1, 'все главы с текстом на месте')
  for (const id of ['site', 'parsing']) {
    await scrollToChapter(page, id)
    await page.waitForTimeout(500)
    const poster = await page.locator(`#${id} .frame__poster img`).evaluate((img) => img.complete && img.naturalWidth > 0)
    ok(poster, `глава ${id}: статичный кадр загружен`)
    await page.screenshot({ path: `${OUT}/${name}-${id}.png` })
  }
  await context.close()
}

await browser.close()
await site.close()
console.log(failures.length ? `\nПровалено проверок: ${failures.length}` : '\nВсе проверки пройдены')
process.exit(failures.length ? 1 : 0)
