// Быстрые скриншоты для просмотра глазами: node scripts/shots.mjs <папка>
// Главная (первый экран, услуги, проект, демо, контакты) и страница проекта, 1440 и 375 px.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const out = process.argv[2] ?? 'test-results/shots'
await mkdir(out, { recursive: true })
const site = await startSite(4321)
const browser = await launchBrowser()
const to = (page, selector) => page.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'start' }), selector)
for (const [name, viewport] of [
  ['d', { width: 1440, height: 900 }],
  ['m', { width: 375, height: 740 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => console.log('pageerror', error.message))
  await page.goto(`${site.url}?eager`, { waitUntil: 'networkidle' })
  await page.waitForSelector('html[data-canvas]', { timeout: 30000 }).catch(() => console.log('нет canvas'))
  await page.waitForTimeout(4500)
  await page.screenshot({ path: `${out}/${name}-1-intro.png` })
  for (const [i, selector] of [['2-services', '#services'], ['3-project', '[data-project="crm"]'], ['4-realtime', '[data-project="realtime"]'], ['5-demos', '#demos'], ['6-contact', '#contact']]) {
    await to(page, selector)
    await page.waitForTimeout(5000)
    await page.screenshot({ path: `${out}/${name}-${i}.png` })
  }
  await page.goto(`${site.url}?eager#/site`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4500)
  await page.screenshot({ path: `${out}/${name}-7-page.png` })
  await page.close()
}
await browser.close()
await site.close()
