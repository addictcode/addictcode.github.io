import type { Content } from '../content'
import { FIRST_LAB_CHAPTER, LAB_KEYS } from '../system/graph'

/** Заголовок и одна фраза о проекте: для карточки на главной и шапки страницы проекта. */
export function projectSummary(t: Content, chapter: number): { title: string; lead: string; kicker?: string } {
  if (chapter >= FIRST_LAB_CHAPTER) {
    const item = t.lab.items[LAB_KEYS[chapter - FIRST_LAB_CHAPTER]]
    return { title: item.name, lead: item.text, kicker: t.lab.kicker }
  }
  switch (chapter) {
    case 1:
      return t.site
    case 2:
      return t.bot
    case 3:
      return t.crm
    case 4:
      return t.realtime
    case 5:
      return t.parsing
    default:
      return t.contact
  }
}
