// Быстрые скриншоты глав для просмотра глазами: node scripts/shots.mjs <папка> [главы через запятую]
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const out = process.argv[2] ?? 'test-results/shots'
const only = process.argv[3]?.split(',')
const CHAPTERS = ['intro', 'site', 'bot', 'crm', 'realtime', 'parsing', 'contact']
await mkdir(out, { recursive: true })
const site = await startSite(4321)
const browser = await launchBrowser()
for (const [name, viewport] of [
  ['d', { width: 1440, height: 900 }],
  ['m', { width: 375, height: 740 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('pageerror', (error) => console.log('pageerror', error.message))
  page.on('console', (message) => message.type() === 'error' && console.log('console', message.text()))
  await page.goto(`${site.url}?eager`, { waitUntil: 'networkidle' })
  await page.waitForSelector('html[data-canvas]', { timeout: 30000 }).catch(() => console.log('нет canvas'))
  for (const id of CHAPTERS) {
    if (only && !only.includes(id)) continue
    await page.evaluate((target) => document.getElementById(target).scrollIntoView({ behavior: 'instant' }), id)
    await page.waitForTimeout(2200)
    await page.screenshot({ path: `${out}/${name}-${id}.png` })
  }
  await page.close()
}
await browser.close()
await site.close()
