// Сквозная проверка собранного сайта в Chromium:
// главная (вступление, карта, выбор проекта узлом и строкой услуги), страницы проектов,
// горизонтальный скролл, оба демо, шесть прототипов, переключатель языка, режимы без WebGL и с prefers-reduced-motion.
// Запуск: npm run build && npm run check. Скриншоты ложатся в test-results/.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const PROJECTS = ['site', 'bot', 'crm', 'realtime', 'parsing']
const LABS = ['booking', 'shop', 'assistant', 'leads', 'prices', 'cabinet']
const PAGES = [...PROJECTS, ...LABS]
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
  const desktop = name.startsWith('desktop')
  // на широком экране услуги подписаны у узлов карты, на узком идут списком под картой
  const pick = (id, node) => (desktop ? page.locator(`.hotspot[data-node="${node}"]`) : page.locator(`.offer button[data-offer="${id}"]`).first())
  ok((await page.locator('.offer button').count()) === 15, 'в списке 15 услуг')
  if (desktop) {
    ok((await page.locator('.hotspot__tag:visible').count()) === 15, 'у каждого узла карты видна подпись')
    ok(!(await page.locator('.offer').isVisible()), 'список скрыт: услуги подписаны на карте')
  }
  ok((await page.locator('.card').count()) === 0, 'пока ничего не выбрано, карточки нет')

  // узел карты выбирает проект
  await page.locator('.hotspot[data-node="bot"]').click()
  await page.locator('.card[data-card="bot"]').waitFor({ timeout: 5000 }).catch(() => {})
  ok((await page.locator('.card[data-card="bot"]').count()) === 1, 'клик по узлу bot открыл карточку проекта')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/${name}-home-selected.png` })

  // строка услуги выбирает проект, кнопка «Закрыть» снимает выбор
  await pick('crm', 'db').click()
  ok((await page.locator('.card[data-card="crm"]').count()) === 1, 'услуга открыла карточку CRM')
  await page.locator('.card__close').click()
  ok((await page.locator('.card').count()) === 0, 'карточка закрывается')

  // из карточки на страницу проекта и обратно
  await pick('site', 'site').click()
  await page.locator('.card a.btn').click()
  await page.waitForSelector('article#site')
  ok(new URL(page.url()).hash === '#/site', 'карточка ведёт на страницу проекта')
  await page.locator('.back').click()
  await page.waitForSelector('#offer')
  ok((await page.locator('.card[data-card="site"]').count()) === 1, 'после возврата проект остаётся выбранным')
  ok((await overflow(page)) <= 0, 'главная: нет горизонтального скролла')

  for (const id of PAGES) {
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

/* 3б. Демо-прототипы */
console.log('\nдемо-прототипы')
{
  const { context, page } = await open()
  const go = async (id) => {
    await page.goto(`${site.url}#/${id}`)
    await page.waitForSelector(`.lab[data-lab="${id}"]`)
    return page.locator('.lab')
  }

  let lab = await go('booking')
  await lab.locator('.opts .btn').first().click()
  await lab.locator('.opts .btn').first().click()
  await lab.locator('.opts .btn:not([disabled])').first().click()
  await lab.locator('[data-action="pay"]').click()
  ok((await lab.locator('[data-done]').count()) === 1 && (await lab.locator('.table tbody tr').count()) === 3, 'запись: бот подтвердил, запись появилась в админке')
  ok((await lab.locator('[data-kpi="revenue"]').textContent()).trim().startsWith('65'), 'запись: оплата попала в выручку')
  await lab.screenshot({ path: `${OUT}/lab-booking.png` })

  lab = await go('shop')
  await lab.locator('[data-add="0"]').click()
  await lab.locator('[data-add="2"]').click()
  ok((await lab.locator('[data-kpi="total"]').textContent()).trim().startsWith('36'), 'магазин: корзина считает сумму')
  await lab.locator('[data-action="pay"]').click()
  ok((await lab.locator('[data-order]').count()) === 1, 'магазин: продавец получил заказ')
  await lab.screenshot({ path: `${OUT}/lab-shop.png` })

  lab = await go('assistant')
  await lab.locator('.opts .btn').nth(0).click()
  ok((await lab.locator('[data-answer="kb"]').count()) === 1, 'ассистент: ответил по базе знаний')
  await lab.locator('.opts .btn').nth(3).click()
  ok((await lab.locator('[data-answer="handoff"]').count()) === 1, 'ассистент: без ответа передал оператору')
  await lab.screenshot({ path: `${OUT}/lab-assistant.png` })

  lab = await go('leads')
  await lab.locator('input[name="name"]').fill('Тест Тестов')
  await lab.locator('button[type="submit"]').click()
  ok((await lab.locator('[data-stage="0"] [data-lead]').count()) === 1, 'заявки: заявка появилась в CRM')
  await lab.locator('[data-action="move"]').click()
  const stage = (await lab.locator('[data-stage="1"] .label').textContent()).trim()
  ok((await lab.locator('[data-client-lead] .status').textContent()).trim() === stage, 'заявки: новый статус вернулся клиенту')
  await lab.screenshot({ path: `${OUT}/lab-leads.png` })

  lab = await go('prices')
  for (let i = 0; i < 3; i += 1) await lab.locator('[data-action="check"]').click()
  ok((await lab.locator('[data-kpi="checks"]').textContent()).trim() === '3', 'цены: три проверки прошли')
  const download = page.waitForEvent('download', { timeout: 5000 }).then((file) => file.suggestedFilename(), () => '')
  await lab.locator('[data-action="export"]').click()
  ok((await download).endsWith('.csv'), 'цены: таблица скачивается')
  await lab.screenshot({ path: `${OUT}/lab-prices.png` })

  lab = await go('cabinet')
  await lab.locator('input[name="name"]').fill('Тест Тестов')
  await lab.locator('button[type="submit"]').click()
  await lab.locator('[data-plan="2"]').click()
  await lab.locator('[data-action="pay"]').click()
  ok((await lab.locator('[data-cabinet="ready"]').count()) === 1, 'кабинет: подписка оформлена')
  await lab.locator('[data-role="1"]').click()
  ok((await lab.locator('[data-kpi="mrr"]').textContent()).trim().startsWith('146'), 'кабинет: админка считает выручку с новым пользователем')
  await lab.screenshot({ path: `${OUT}/lab-cabinet.png` })
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
  for (const id of PAGES) {
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
  ok(await posterShown(0), 'на главной показан общий кадр карты')
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
