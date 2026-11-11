// Снимает статичные кадры сцены для каждой станции (RU и EN) в public/posters/.
// Нужна свежая сборка: npm run build && npm run posters && npm run build
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { launchBrowser, startSite } from './browser.mjs'

const SIZE = 1200
const STATIONS = 8

await mkdir('public/posters', { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

for (const lang of ['ru', 'en']) {
  const context = await browser.newContext({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 })
  await context.addInitScript((value) => localStorage.setItem('lang', value), lang)
  const page = await context.newPage()
  for (let station = 0; station < STATIONS; station += 1) {
    await page.goto(`${site.url}?poster=${station}`, { waitUntil: 'load' })
    await page.waitForSelector('html[data-poster-ready]', { state: 'attached', timeout: 30000 })
    await page.waitForTimeout(700)
    const png = await page.screenshot({ omitBackground: true })
    const base = `public/posters/station-${station}-${lang}`
    const webp = await sharp(png).webp({ quality: 80, alphaQuality: 90 }).toFile(`${base}.webp`)
    const avif = await sharp(png).avif({ quality: 55 }).toFile(`${base}.avif`)
    console.log(`${base}: webp ${(webp.size / 1024).toFixed(0)} КБ, avif ${(avif.size / 1024).toFixed(0)} КБ`)
  }
  await context.close()
}

await browser.close()
await site.close()
