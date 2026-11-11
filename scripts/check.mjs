// Сквозная проверка собранного сайта в Chromium:
// скриншоты 1440 и 375 px на каждой станции, горизонтальный скролл,
// оба демо, переключатель языка, режимы без WebGL и с prefers-reduced-motion.
// Запуск: npm run build && npm run check. Скриншоты ложатся в test-results/.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const STATIONS = ['intake', 'site', 'bot', 'crm', 'realtime', 'parsing', 'sorting', 'dispatch']
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
const scrollToStation = (page, id) =>
  page.evaluate((target) => {
    const top = document.getElementById(target).getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, target === 'intake' ? 0 : top - window.innerHeight * 0.1)
  }, id)

/* 1. Скриншоты станций и горизонтальный скролл */
for (const [name, viewport] of [
  ['desktop-1440', { width: 1440, height: 900 }],
  ['mobile-375', { width: 375, height: 740 }],
]) {
  console.log(`\n${name}`)
  const { context, page, errors } = await open({ viewport, deviceScaleFactor: 1, hasTouch: name.startsWith('mobile') })
  await page.waitForSelector('.stage[data-ready]', { timeout: 30000 }).catch(() => {})
  ok((await page.locator('.stage[data-ready]').count()) === 1, '3D-сцена отрисовалась')
  for (const [index, id] of STATIONS.entries()) {
    await scrollToStation(page, id)
    await page.waitForTimeout(1300)
    await page.screenshot({ path: `${OUT}/${name}-${index}-${id}.png` })
    const ticker = await page.locator('.topbar__no').textContent()
    ok(ticker.startsWith(String(index).padStart(2, '0')), `станция ${index} (${id}): счётчик ${ticker}`)
  }
  await page.locator('[data-demo="lead"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${name}-demo-lead.png` })
  ok((await overflow(page)) <= 0, 'нет горизонтального скролла')
  ok(errors.length === 0, `нет ошибок в консоли ${errors.join(' | ')}`)
  await context.close()
}

/* 2. Демо «Монитор объявлений» */
console.log('\nдемо: монитор объявлений')
{
  const { context, page } = await open()
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
  await page.locator('.langs__btn[lang="en"]').click()
  await page.waitForTimeout(300)
  // кириллица в EN-версии допустима только в примере раскладки («привод») и в каталоге макета
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
  await page.screenshot({ path: `${OUT}/lang-en.png` })
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
  ok((await page.locator('.stage[data-mode="static"]').count()) === 1, 'включилась статичная версия')
  ok((await page.locator('canvas').count()) === 0, 'canvas не создавался')
  ok((await page.locator('main h2').count()) >= 8, 'все станции с текстом на месте')
  for (const id of ['site', 'parsing']) {
    await scrollToStation(page, id)
    await page.waitForTimeout(500)
    const poster = await page.locator('.stage__poster img').evaluate((img) => img.complete && img.naturalWidth > 0)
    ok(poster, `станция ${id}: статичный кадр загружен`)
    await page.screenshot({ path: `${OUT}/${name}-${id}.png` })
  }
  await context.close()
}

await browser.close()
await site.close()
console.log(failures.length ? `\nПровалено проверок: ${failures.length}` : '\nВсе проверки пройдены')
process.exit(failures.length ? 1 : 0)
