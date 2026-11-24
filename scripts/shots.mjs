// Скриншоты для просмотра глазами: node scripts/shots.mjs <папка>
// Путь заявки на нескольких точках прогресса и остальные разделы, 1440 и 375 px.
import { mkdir } from 'node:fs/promises'
import { launchBrowser, startSite } from './browser.mjs'

const out = process.argv[2] ?? 'test-results/shots'
const POINTS = [0, 0.06, 0.12, 0.25, 0.32, 0.4, 0.52, 0.64, 0.78, 0.97]
await mkdir(out, { recursive: true })
const site = await startSite(4321)
const browser = await launchBrowser()
for (const [name, viewport] of [
  ['d', { width: 1440, height: 900 }],
  ['m', { width: 375, height: 740 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('pageerror', (error) => console.log('pageerror', error.message))
  await page.goto(site.url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  for (const p of POINTS) {
    await page.evaluate((progress) => {
      const section = document.querySelector('.journey')
      const top = section.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: top + progress * (section.offsetHeight - window.innerHeight), behavior: 'instant' })
    }, p)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/${name}-p${String(Math.round(p * 100)).padStart(2, '0')}.png` })
  }
  for (const id of ['works', 'contact']) {
    await page.evaluate((target) => document.getElementById(target).scrollIntoView({ behavior: 'instant' }), id)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/${name}-${id}.png` })
  }
  await page.close()
}
await browser.close()
await site.close()
