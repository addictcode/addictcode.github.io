// Собирает OG-картинку 1200×630 и PNG-иконки в стиле сайта.
// Тексты берутся со страницы (то есть из src/content), кадр сцены — из public/posters.
// Нужна свежая сборка: npm run build && npm run og
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { launchBrowser, startSite } from './browser.mjs'

const site = await startSite()
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(`${site.url}?static`, { waitUntil: 'networkidle' })

await page.evaluate(() => {
  const text = (selector) => document.querySelector(selector).textContent
  const card = document.createElement('div')
  card.className = 'og'
  card.innerHTML = `
    <style>
      .og { position: fixed; inset: 0; z-index: 99; overflow: hidden; background: var(--bg); }
      .og__who { position: absolute; left: 64px; top: 60px; color: var(--muted); font-size: 17px; }
      .og__title { position: absolute; left: 64px; top: 150px; width: 640px; font-size: 80px; line-height: 1.02; }
      .og__phrase { position: absolute; left: 64px; bottom: 64px; width: 560px; font-size: 25px; line-height: 1.4; color: var(--muted); }
      .og img { position: absolute; right: -40px; top: 15px; width: 600px; height: 600px; }
    </style>
    <p class="og__who mono"></p>
    <img src="/posters/chapter-0.webp" alt="" />
    <h1 class="og__title"></h1>
    <p class="og__phrase"></p>`
  card.querySelector('.og__who').textContent = text('.hero__who')
  card.querySelector('.og__title').textContent = text('.hero h1')
  card.querySelector('.og__phrase').textContent = text('.hero__phrase')
  document.body.append(card)
})
await page.waitForFunction(() => document.querySelector('.og img').complete)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
await page.screenshot({ path: 'public/og.png' })
await browser.close()
await site.close()

const png = await sharp('public/og.png').png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer()
await sharp(png).toFile('public/og.png')
const icon = await readFile('public/favicon.svg')
await sharp(icon, { density: 400 }).resize(32, 32).png().toFile('public/favicon-32.png')
await sharp(icon, { density: 400 }).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log(`og.png: ${(png.length / 1024).toFixed(0)} КБ`)
