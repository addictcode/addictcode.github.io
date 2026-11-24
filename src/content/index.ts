import { en } from './en'
import { ru } from './ru'
import type { Content, Lang } from './types'

export const content: Record<Lang, Content> = { ru, en }
export const languages: Lang[] = ['ru', 'en']
export type { Content, Lang, Work, WorkId } from './types'
