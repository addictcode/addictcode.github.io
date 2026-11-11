// Снимает статичные кадры лент для каждой главы (RU и EN) в public/posters/.
// Нужна свежая сборка: npm run build && npm run posters && npm run build
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { launchBrowser, startSite } from './browser.mjs'

const CHAPTERS = 7
// широкий кадр для десктопа и вертикальный для телефона
const SIZES = [
  { suffix: '', width: 1600, height: 1000 },
  { suffix: '-m', width: 750, height: 1100 },
]

await mkdir('public/posters', { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

for (const lang of ['ru', 'en']) {
  for (const size of SIZES) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 })
    await context.addInitScript((value) => localStorage.setItem('lang', value), lang)
    const page = await context.newPage()
    for (let chapter = 0; chapter < CHAPTERS; chapter += 1) {
      await page.goto(`${site.url}?poster=${chapter}`, { waitUntil: 'load' })
      await page.waitForSelector('html[data-poster-ready]', { state: 'attached', timeout: 30000 })
      await page.waitForTimeout(900)
      const png = await page.screenshot({ omitBackground: true })
      const base = `public/posters/chapter-${chapter}-${lang}${size.suffix}`
      const webp = await sharp(png).webp({ quality: 78, alphaQuality: 90 }).toFile(`${base}.webp`)
      const avif = await sharp(png).avif({ quality: 50 }).toFile(`${base}.avif`)
      console.log(`${base}: webp ${(webp.size / 1024).toFixed(0)} КБ, avif ${(avif.size / 1024).toFixed(0)} КБ`)
    }
    await context.close()
  }
}

await browser.close()
await site.close()
