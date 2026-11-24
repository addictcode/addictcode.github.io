// Собирает OG-картинку 1200×630 и PNG-иконки.
// Снимается первый экран собранного сайта: заголовок со словом-карточкой.
// Нужна свежая сборка: npm run build && npm run og
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { launchBrowser, startSite } from './browser.mjs'

const site = await startSite()
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(site.url, { waitUntil: 'networkidle' })
// на картинке нужен сам заголовок: без меню, кнопок и подсказки
await page.addStyleTag({ content: '.topbar__nav, .topbar__tools, .hero__actions, .hero__cue, .skip { display: none !important }' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(2600)
await page.screenshot({ path: 'public/og.png' })
await browser.close()
await site.close()

const png = await sharp('public/og.png').png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer()
await sharp(png).toFile('public/og.png')
const icon = await readFile('public/favicon.svg')
await sharp(icon, { density: 400 }).resize(32, 32).png().toFile('public/favicon-32.png')
await sharp(icon, { density: 400 }).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log(`og.png: ${(png.length / 1024).toFixed(0)} КБ`)
