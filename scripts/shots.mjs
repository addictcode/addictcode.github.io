// Быстрые скриншоты для просмотра глазами: node scripts/shots.mjs <папка>
// Главная (вступление, карта, выбранный проект) и страница проекта, 1440 и 375 px.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const out = process.argv[2] ?? 'test-results/shots'
await mkdir(out, { recursive: true })
const site = await startSite(4321)
const browser = await launchBrowser()
for (const [name, viewport] of [
  ['d', { width: 1440, height: 900 }],
  ['m', { width: 375, height: 740 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('pageerror', (error) => console.log('pageerror', error.message))
  await page.goto(`${site.url}?eager`, { waitUntil: 'networkidle' })
  await page.waitForSelector('html[data-canvas]', { timeout: 30000 }).catch(() => console.log('нет canvas'))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}/${name}-1-intro.png` })
  await page.evaluate(() => document.getElementById('offer').scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${out}/${name}-2-offer.png` })
  await page.locator('.hotspot[data-node="crm"]').click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${out}/${name}-3-selected.png` })
  await page.locator('.card a.btn').click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${out}/${name}-4-project.png` })
  await page.close()
}
await browser.close()
await site.close()
