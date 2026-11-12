// Снимает кадр фигуры для статичной версии в public/posters/: широкий и вертикальный.
// На кадре нет текста, поэтому он общий для RU и EN.
// Нужна свежая сборка: npm run build && npm run posters && npm run build
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { launchBrowser, startSite } from './browser.mjs'

const SHAPE = 'core'
// широкий кадр для десктопа и вертикальный для телефона
const SIZES = [
  { suffix: '', width: 1600, height: 1000 },
  { suffix: '-m', width: 750, height: 1100 },
]

await mkdir('public/posters', { recursive: true })
const site = await startSite()
const browser = await launchBrowser()

for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 })
  {
    await page.goto(`${site.url}?poster=${SHAPE}`, { waitUntil: 'load' })
    await page.waitForSelector('html[data-poster-ready]', { state: 'attached', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(900)
    const png = await page.screenshot()
    const base = `public/posters/${SHAPE}${size.suffix}`
    const webp = await sharp(png).webp({ quality: 76 }).toFile(`${base}.webp`)
    const avif = await sharp(png).avif({ quality: 48 }).toFile(`${base}.avif`)
    console.log(`${base}: webp ${(webp.size / 1024).toFixed(0)} КБ, avif ${(avif.size / 1024).toFixed(0)} КБ`)
  }
  await page.close()
}

await browser.close()
await site.close()
