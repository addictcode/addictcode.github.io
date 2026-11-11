import type { Content } from '../content'

/** Заголовок и одна фраза о проекте: для карточки на главной и шапки страницы проекта. */
export function projectSummary(t: Content, chapter: number): { title: string; lead: string; kicker?: string } {
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
