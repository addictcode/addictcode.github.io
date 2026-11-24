// Сквозная проверка собранного сайта в Chromium:
// путь заявки на 1440 и 375 px (скриншоты по точкам прогресса), раздел «Работы» (раскрытие, схема за курсором,
// поиск по раскладке), заявка в Telegram, переключатель языка, статичная версия при prefers-reduced-motion.
// Запуск: npm run build && npm run check. Скриншоты ложатся в test-results/.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const OUT = 'test-results'
const POINTS = [0, 0.06, 0.25, 0.52, 0.78, 0.97]
const failures = []
const ok = (condition, message) => {
  console.log(`${condition ? '  ok  ' : ' FAIL '} ${message}`)
  if (!condition) failures.push(message)
}

await mkdir(OUT, { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

async function open(options = {}, query = '') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...options })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
  await page.goto(site.url + query, { waitUntil: 'networkidle' })
  return { context, page, errors }
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const toProgress = (page, p) =>
  page.evaluate((progress) => {
    const section = document.querySelector('.journey')
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + progress * (section.offsetHeight - window.innerHeight), behavior: 'instant' })
  }, p)
const activeStep = (page) => page.evaluate(() => document.querySelector('.step[data-on]')?.getAttribute('data-step') ?? null)

/* 1. Путь заявки */
for (const [name, viewport] of [
  ['desktop-1440', { width: 1440, height: 900 }],
  ['mobile-375', { width: 375, height: 740 }],
]) {
  console.log(`\n${name}`)
  const { context, page, errors } = await open({ viewport, hasTouch: name.startsWith('mobile') })
  await page.waitForTimeout(1800)
  ok((await page.locator('h1').count()) === 1, 'один заголовок первого уровня')
  for (const p of POINTS) {
    await toProgress(page, p)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/${name}-journey-${String(Math.round(p * 100)).padStart(2, '0')}.png` })
  }
  await toProgress(page, 0)
  await page.waitForTimeout(700)
  ok(await page.locator('.hero__title .chip').isVisible(), 'первый экран: плашка стоит в заголовке')
  ok((await page.locator('.journey .card').evaluate((el) => getComputedStyle(el).opacity)) === '0', 'первый экран: летящая карточка ещё спрятана')

  await toProgress(page, 0.25)
  await page.waitForTimeout(900)
  ok((await activeStep(page)) === '0', 'шаг 1 «Сайт» на экране')
  ok((await page.locator('.journey .face--form .field__value').nth(1).textContent()).length > 3, 'шаг 1: задача печатается в форме')
  await toProgress(page, 0.52)
  await page.waitForTimeout(900)
  ok((await activeStep(page)) === '1', 'шаг 2 «Бот» на экране')
  ok((await page.locator('.journey .note__ticks.is-read').count()) === 1, 'шаг 2: заявка прочитана, две галочки')
  await toProgress(page, 0.78)
  await page.waitForTimeout(900)
  ok((await activeStep(page)) === '2', 'шаг 3 «CRM» на экране')
  await toProgress(page, 0.98)
  await page.waitForTimeout(1100)
  ok((await activeStep(page)) === '3', 'итог на экране')
  ok((await page.locator('.journey .status.is-paid').count()) === 1, 'шаг 3: карточка дошла до «Оплачено»')
  ok((await overflow(page)) <= 0, 'нет горизонтального скролла')

  /* слово в плашке меняется само, пока посетитель на первом экране */
  await toProgress(page, 0)
  await page.waitForTimeout(800)
  const firstWord = await page.locator('.hero__title .chip__word').textContent()
  await page.waitForTimeout(2600)
  ok((await page.locator('.hero__title .chip__word').textContent()) !== firstWord, 'слово в плашке меняется')

  /* «Как это работает» ведёт к первому шагу */
  if (name.startsWith('desktop')) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.locator('.hero__actions a[href="#how"]').click()
    await page.waitForTimeout(2500)
    ok((await activeStep(page)) === '0', 'кнопка «Как это работает» открывает первый шаг')
  }

  /* Услуги */
  ok((await page.locator('.service').count()) === 6, 'в «Услугах» шесть решений с ценой')
  await page.locator('#services').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}/${name}-services.png` })

  /* Работы */
  await page.locator('#works').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}/${name}-works.png` })
  ok((await page.locator('.work').count()) === 3, 'в «Работах» три проекта')
  if (name.startsWith('desktop')) {
    await page.locator('.work[data-work="crm"] .work__row').hover()
    await page.waitForTimeout(600)
    ok((await page.locator('.works__float-item.is-on').count()) === 1, 'при наведении за курсором появляется схема проекта')
    await page.screenshot({ path: `${OUT}/${name}-works-hover.png` })
  }
  await page.locator('.work[data-work="dealer"] .work__row').click()
  ok((await page.locator('.work[data-work="dealer"] .work__row').getAttribute('aria-expanded')) === 'true', 'строка раскрывается')
  await page.locator('.lsearch input').fill('ghbdjl')
  ok((await page.locator('.lsearch__out').textContent()).includes('привод'), 'поиск дилера понимает «ghbdjl»')
  await page.locator('.work[data-work="dealer"]').screenshot({ path: `${OUT}/${name}-work-open.png` })

  /* Условия и вопросы */
  await page.locator('.faq__item').first().locator('summary').click()
  ok(await page.locator('.faq__item').first().locator('p').isVisible(), 'вопрос раскрывается')
  await page.locator('#terms').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}/${name}-terms.png` })

  /* Заявка: «Выбрать» у услуги отмечает её в карточке */
  await page.locator('[data-choose="0"]').click()
  await page.waitForTimeout(1500)
  ok((await page.locator('.pick[data-need="0"]').getAttribute('aria-pressed')) === 'true', '«Выбрать» отмечает услугу в заявке')
  await page.locator('.pick[data-need="2"]').click()
  await page.locator('.request textarea').fill('Тестовая задача')
  const href = await page.locator('[data-send]').getAttribute('href')
  const text = decodeURIComponent(new URL(href).searchParams.get('text') ?? '')
  ok(href.startsWith('https://t.me/heaphog?text=') && text.includes('Telegram-бот') && text.includes('CRM') && text.includes('Тестовая задача'), 'кнопка заявки собирает текст для Telegram')
  await page.locator('#contact').screenshot({ path: `${OUT}/${name}-contact.png` })
  ok((await overflow(page)) <= 0, 'нет горизонтального скролла после раскрытий')
  ok(errors.length === 0, `нет ошибок в консоли ${errors.join(' | ')}`)
  await context.close()
}

/* 2. Переключатель языка */
console.log('\nязык')
{
  const { context, page } = await open()
  await page.locator('.langs button[lang="en"]').click()
  await page.waitForTimeout(400)
  await page.locator('.work[data-work="dealer"] .work__row').click()
  // кириллица в EN допустима только в примере поиска дилера: это русские слова каталога
  const leftovers = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT)
    const found = []
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim()
      if (/[А-Яа-яЁё]/.test(text) && !walker.currentNode.parentElement.closest('.pv--dealer, .lsearch')) found.push(text)
    }
    return found
  })
  ok(leftovers.length === 0, `в EN не осталось русского текста ${leftovers.slice(0, 5).join(' | ')}`)
  ok((await page.getAttribute('html', 'lang')) === 'en', 'html lang = en')
  ok(!/[А-Яа-яЁё]/.test(await page.title()), 'заголовок вкладки на английском')
  await page.screenshot({ path: `${OUT}/lang-en.png` })
  await page.reload({ waitUntil: 'networkidle' })
  ok((await page.getAttribute('html', 'lang')) === 'en', 'выбор языка запомнился после перезагрузки')
  await context.close()
}

/* 3. Статичная версия */
for (const [name, options] of [
  ['reduced-motion-1440', { reducedMotion: 'reduce' }],
  ['reduced-motion-375', { reducedMotion: 'reduce', viewport: { width: 375, height: 740 } }],
]) {
  console.log(`\n${name}`)
  const { context, page, errors } = await open(options)
  ok((await page.locator('.journey--still').count()) === 1, 'включилась статичная версия')
  ok((await page.locator('.still__step').count()) === 3, 'все три шага стоят друг под другом')
  ok((await page.locator('.still .card--still').count()) === 3, 'в каждой декорации видна карточка заявки')
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  ok((await overflow(page)) <= 0, 'нет горизонтального скролла')
  ok(errors.length === 0, `нет ошибок в консоли ${errors.join(' | ')}`)
  await context.close()
}

await browser.close()
await site.close()
console.log(failures.length ? `\nПровалено проверок: ${failures.length}` : '\nВсе проверки пройдены')
process.exit(failures.length ? 1 : 0)
