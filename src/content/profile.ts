/** Название студии и контакты. Название и Telegram-ник меняются только здесь. */
export const profile = {
  studio: 'addictcode',
  telegram: 'heaphog',
  github: 'addictcode',
} as const

export const telegramUrl = `https://t.me/${profile.telegram}`
export const githubUrl = `https://github.com/${profile.github}`

export const links = {
  vintedRepo: 'https://github.com/addictcode/vinted-telegram-bot',
  pulseRepo: 'https://github.com/addictcode/pulse-crypto-screener',
  pulseDemo: 'https://addictcode.github.io/pulse-crypto-screener/',
  taskEngineRepo: 'https://github.com/addictcode/distributed-task-engine',
  taskEngineDemo: 'https://addictcode.github.io/distributed-task-engine/',
} as const
