import { en } from './en'
import { ru } from './ru'
import type { Content, Lang } from './types'

export const content: Record<Lang, Content> = { ru, en }
export const languages: Lang[] = ['ru', 'en']
export const CHAPTER_COUNT = ru.chapters.length
/** id якорей глав, общие для обоих языков */
export const chapterIds = [
  'intro',
  'site',
  'bot',
  'crm',
  'realtime',
  'parsing',
  'contact',
  // демо-прототипы
  'booking',
  'shop',
  'assistant',
  'leads',
  'prices',
  'cabinet',
] as const
export type { Content, Lang } from './types'
