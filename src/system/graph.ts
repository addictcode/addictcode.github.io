/**
 * Главы сайта и их связь с услугами и формами 3D-скульптуры.
 * Здесь только данные, без three.js: файл нужен и интерфейсу, и сцене.
 */

/** Технические имена частей системы. Ими демо помечают свои события: скульптура откликается на любое. */
export const NODE_IDS = ['client', 'site', 'bot', 'crm', 'db', 'stream', 'queue', 'parser', 'llm', 'booking', 'shop', 'assistant', 'sync', 'prices', 'billing'] as const
export type NodeId = (typeof NODE_IDS)[number]

/** Главы проектов на главной, по порядку. */
export const PROJECT_CHAPTERS = [1, 2, 3, 4, 5] as const
/** Глава контактов: своей страницы у неё нет. */
export const CONTACT_CHAPTER = 6
/** Первая глава демо-прототипов: главы с неё и дальше — прототипы на выдуманных данных. */
export const FIRST_LAB_CHAPTER = 7
/** Ключи прототипов в контенте (`lab.items`), по порядку глав. */
export const LAB_KEYS = ['booking', 'shop', 'assistant', 'crm', 'prices', 'cabinet'] as const
export type LabKey = (typeof LAB_KEYS)[number]
export const LAB_CHAPTERS = LAB_KEYS.map((_, i) => FIRST_LAB_CHAPTER + i)

/** Глава, в которой услуга уже работает: по номеру строки `offer.items`. */
export const OFFER_CHAPTER: number[] = [1, 1, 2, 3, 5, 5, 4, 3, 4, 7, 8, 9, 10, 11, 12]
/** Сколько первых строк `offer.items` подтверждены готовыми проектами; остальные — демо-прототипы. */
export const REAL_OFFERS = 9

/** Формы, в которые собирается скульптура. */
export const SHAPES = ['core', 'services', 'site', 'bot', 'crm', 'wave', 'funnel', 'calendar', 'boxes', 'bars', 'cards', 'plane'] as const
export type ShapeId = (typeof SHAPES)[number]

/** Форма скульптуры для главы. */
export const CHAPTER_SHAPE: ShapeId[] = ['core', 'site', 'bot', 'crm', 'wave', 'funnel', 'plane', 'calendar', 'boxes', 'bot', 'crm', 'bars', 'cards']

/** Разделы главной: по ним ходит навигация в шапке. */
export const SECTIONS = ['services', 'projects', 'demos', 'contact'] as const
