/** Название студии и контакты. Название и Telegram-ник меняются только здесь. */
export const profile = {
  studio: 'addictcode',
  telegram: 'heaphog',
  github: 'addictcode',
} as const

export const telegramUrl = `https://t.me/${profile.telegram}`
export const githubUrl = `https://github.com/${profile.github}`

/** Ссылки проектов из раздела «Работы». У коммерческих заказов и TenderRadar ссылок нет. */
export const workLinks = {
  vinted: { code: 'https://github.com/addictcode/vinted-telegram-bot' },
  pulse: { code: 'https://github.com/addictcode/pulse-crypto-screener', demo: 'https://addictcode.github.io/pulse-crypto-screener/' },
  engine: { code: 'https://github.com/addictcode/distributed-task-engine', demo: 'https://addictcode.github.io/distributed-task-engine/' },
} as const
