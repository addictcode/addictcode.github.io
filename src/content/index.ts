import { en } from './en'
import { ru } from './ru'
import type { Content, Lang } from './types'

export const content: Record<Lang, Content> = { ru, en }
export const languages: Lang[] = ['ru', 'en']
export const STATION_COUNT = ru.stations.length
/** id якорей станций, общие для обоих языков */
export const stationIds = ['intake', 'site', 'bot', 'crm', 'realtime', 'parsing', 'sorting', 'dispatch'] as const
export type { Content, Lang } from './types'
