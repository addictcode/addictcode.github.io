// Снимает статичные кадры фигуры для каждой главы в public/posters/.
// Нужна свежая сборка: npm run build && npm run posters && npm run build
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { launchBrowser, startSite } from './browser.mjs'

const SIZE = 1000
const CHAPTERS = 8

await mkdir('public/posters', { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

const context = await browser.newContext({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 })
const page = await context.newPage()
for (let chapter = 0; chapter < CHAPTERS; chapter += 1) {
  await page.goto(`${site.url}?poster=${chapter}`, { waitUntil: 'load' })
  await page.waitForSelector('html[data-poster-ready]', { state: 'attached', timeout: 30000 })
  await page.waitForTimeout(700)
  const png = await page.screenshot({ omitBackground: true })
  const base = `public/posters/chapter-${chapter}`
  const webp = await sharp(png).webp({ quality: 82, alphaQuality: 90 }).toFile(`${base}.webp`)
  const avif = await sharp(png).avif({ quality: 55 }).toFile(`${base}.avif`)
  console.log(`${base}: webp ${(webp.size / 1024).toFixed(0)} КБ, avif ${(avif.size / 1024).toFixed(0)} КБ`)
}

await browser.close()
await site.close()
