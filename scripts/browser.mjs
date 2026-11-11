// Общие помощники для скриптов: локальный сервер собранного сайта и Chromium из Playwright.
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { preview } from 'vite'

const require = createRequire(import.meta.url)

/** Playwright берётся из проекта, а если его нет — из глобальной установки. */
function loadPlaywright() {
  try {
    return require('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return require(`${globalRoot}/playwright`)
  }
}

export async function startSite(port = 4319) {
  const server = await preview({ preview: { port, strictPort: true }, logLevel: 'silent' })
  return { url: `http://localhost:${port}/`, close: () => server.close() }
}

export async function launchBrowser() {
  const { chromium } = loadPlaywright()
  // программный WebGL, чтобы сцена рисовалась и без видеокарты
  return chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
}
