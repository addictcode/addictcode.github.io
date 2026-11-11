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
  const [first, last] = [...document.querySelectorAll('.hero__name span')].map((el) => el.textContent)
  const card = document.createElement('div')
  card.className = 'og'
  card.innerHTML = `
    <style>
      .og { position: fixed; inset: 0; z-index: 99; overflow: hidden; background: var(--paper);
        background-image: radial-gradient(#15140f1f 1px, transparent 1.2px); background-size: 22px 22px; }
      .og__strip { position: absolute; inset: 0 0 auto; display: flex; justify-content: space-between;
        padding: 14px 48px; background: var(--ink); color: var(--sheet); font-size: 15px; }
      .og__name { position: absolute; left: 48px; top: 92px; font-family: var(--font-display); font-weight: 900;
        font-size: 166px; line-height: 0.84; text-transform: uppercase; }
      .og__name span { display: block; }
      .og__name span:last-child { color: transparent; -webkit-text-stroke: 3px var(--ink); }
      .og__phrase { position: absolute; left: 48px; bottom: 50px; width: 520px; font-size: 27px; line-height: 1.3; }
      .og img { position: absolute; right: -250px; top: -130px; width: 1000px; height: 1000px; }
      .og__mark { position: absolute; right: 48px; bottom: 44px; padding: 8px 14px; background: var(--signal);
        border: 2px solid var(--ink); font-size: 17px; }
    </style>
    <p class="og__strip mono"><span></span><span>addictcode.github.io</span></p>
    <img src="/posters/station-0-ru.webp" alt="" />
    <p class="og__name"><span></span><span></span></p>
    <p class="og__phrase"></p>
    <p class="og__mark mono">Telegram · GitHub</p>`
  card.querySelector('.og__strip span').textContent = text('.hero__role')
  const spans = card.querySelectorAll('.og__name span')
  spans[0].textContent = first
  spans[1].textContent = last
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
