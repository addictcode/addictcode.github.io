/** Контакты владельца. Telegram-ник меняется только здесь. */
export const profile = {
  telegram: 'CHANGE_ME',
  github: 'addictcode',
  siteUrl: 'https://addictcode.github.io',
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
