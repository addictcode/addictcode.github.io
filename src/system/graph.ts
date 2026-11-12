/**
 * Карта системы: узлы, связи и ракурсы камеры по главам.
 * Здесь только данные и поиск маршрута, без three.js: файл нужен и интерфейсу, и сцене.
 */
export const NODE_IDS = [
  'client',
  'site',
  'bot',
  'crm',
  'db',
  'stream',
  'queue',
  'parser',
  'llm',
  // узлы демо-прототипов
  'booking',
  'shop',
  'assistant',
  'sync',
  'prices',
  'billing',
] as const
export type NodeId = (typeof NODE_IDS)[number]

interface NodeDef {
  x: number
  z: number
  /** техническое имя на карте, одинаковое в обоих языках */
  label: string
}

export const NODES: Record<NodeId, NodeDef> = {
  client: { x: -10, z: 5, label: 'client' },
  site: { x: -5, z: 1, label: 'site' },
  bot: { x: 0, z: 6, label: 'bot' },
  crm: { x: 2, z: -1, label: 'crm' },
  db: { x: 7, z: 3, label: 'postgres' },
  stream: { x: 9, z: -4, label: 'stream' },
  queue: { x: 14.5, z: 1.5, label: 'queue' },
  parser: { x: -6, z: -7, label: 'parser' },
  llm: { x: 2, z: -7, label: 'llm' },
  booking: { x: 5, z: 11, label: 'booking' },
  shop: { x: -5, z: 11, label: 'shop' },
  assistant: { x: 9, z: -10, label: 'assistant' },
  sync: { x: -11, z: -2, label: 'crm-sync' },
  prices: { x: -13, z: -7, label: 'prices' },
  billing: { x: 13, z: 8, label: 'billing' },
}

type Point = [x: number, z: number]

interface EdgeDef {
  from: NodeId
  to: NodeId
  /** ломаная под прямыми углами, от узла к узлу */
  path: Point[]
}

const at = (id: NodeId): Point => [NODES[id].x, NODES[id].z]

export const EDGES: EdgeDef[] = [
  { from: 'client', to: 'site', path: [at('client'), [-5, 5], at('site')] },
  { from: 'site', to: 'bot', path: [at('site'), [-2.5, 1], [-2.5, 6], at('bot')] },
  { from: 'site', to: 'crm', path: [at('site'), [-5, -1], at('crm')] },
  { from: 'bot', to: 'crm', path: [at('bot'), [2, 6], at('crm')] },
  { from: 'crm', to: 'db', path: [at('crm'), [4.5, -1], [4.5, 3], at('db')] },
  { from: 'crm', to: 'stream', path: [at('crm'), [4.5, -1], [4.5, -4], at('stream')] },
  { from: 'db', to: 'queue', path: [at('db'), [14.5, 3], at('queue')] },
  { from: 'queue', to: 'stream', path: [at('queue'), [14.5, -4], at('stream')] },
  { from: 'parser', to: 'llm', path: [at('parser'), at('llm')] },
  { from: 'llm', to: 'crm', path: [at('llm'), at('crm')] },
  { from: 'bot', to: 'booking', path: [at('bot'), [0, 8.5], [5, 8.5], at('booking')] },
  { from: 'bot', to: 'shop', path: [at('bot'), [0, 8.5], [-5, 8.5], at('shop')] },
  { from: 'llm', to: 'assistant', path: [at('llm'), [2, -10], at('assistant')] },
  { from: 'site', to: 'sync', path: [at('site'), [-8, 1], [-8, -2], at('sync')] },
  { from: 'parser', to: 'prices', path: [at('parser'), at('prices')] },
  { from: 'db', to: 'billing', path: [at('db'), [7, 8], at('billing')] },
]

/** Какие узлы в фокусе на каждой главе. На первой карта показана целиком. */
export const CHAPTER_FOCUS: NodeId[][] = [
  [],
  ['site'],
  ['bot'],
  ['crm', 'db'],
  ['stream', 'queue'],
  ['parser', 'llm'],
  ['client'],
  ['booking'],
  ['shop'],
  ['assistant'],
  ['sync'],
  ['prices'],
  ['billing'],
]

/** Главы с общим видом карты: вступление и контакты. */
export const OVERVIEW_CHAPTERS = [0, 6]
/** Первая глава демо-прототипов: главы с неё и дальше — прототипы на выдуманных данных. */
export const FIRST_LAB_CHAPTER = 7
/** Ключи прототипов в контенте (`lab.items`), по порядку глав. */
export const LAB_KEYS = ['booking', 'shop', 'assistant', 'crm', 'prices', 'cabinet'] as const
export type LabKey = (typeof LAB_KEYS)[number]

/** Узел, от которого и к которому идёт пакет при переходе между главами. */
export const CHAPTER_NODE: NodeId[] = ['client', 'site', 'bot', 'crm', 'stream', 'parser', 'client', 'booking', 'shop', 'assistant', 'sync', 'prices', 'billing']

export interface Shot {
  x: number
  z: number
  dist: number
  /** поворот вокруг вертикали и наклон от вертикали, в градусах */
  azimuth: number
  polar: number
  /** во сколько раз камера дальше на узком экране */
  narrow: number
}

export const SHOTS: Shot[] = [
  { x: 0.5, z: 0.5, dist: 58, azimuth: 32, polar: 56, narrow: 1.85 },
  { x: -5, z: 1, dist: 21, azimuth: 18, polar: 56, narrow: 1.2 },
  { x: 0, z: 5.6, dist: 20, azimuth: -28, polar: 58, narrow: 1.2 },
  { x: 4.3, z: 0.8, dist: 25, azimuth: 36, polar: 54, narrow: 1.2 },
  { x: 11.7, z: -1.2, dist: 26, azimuth: -34, polar: 55, narrow: 1.55 },
  { x: -2, z: -7, dist: 25, azimuth: 24, polar: 57, narrow: 1.75 },
  { x: -3, z: 2, dist: 40, azimuth: -52, polar: 60, narrow: 1.5 },
  { x: 5, z: 11, dist: 21, azimuth: 26, polar: 56, narrow: 1.2 },
  { x: -5, z: 11, dist: 21, azimuth: -24, polar: 57, narrow: 1.2 },
  { x: 9, z: -10, dist: 21, azimuth: -30, polar: 56, narrow: 1.2 },
  { x: -11, z: -2, dist: 21, azimuth: 30, polar: 56, narrow: 1.25 },
  { x: -13, z: -7, dist: 21, azimuth: 20, polar: 57, narrow: 1.2 },
  { x: 13, z: 8, dist: 21, azimuth: -32, polar: 56, narrow: 1.2 },
]

/** Общий вид карты на главной, когда посетитель долистал до блока с услугами: карта по центру, ближе и круче сверху. */
export const EXPLORE_SHOT: Shot = { x: -1.3, z: -0.4, dist: 58, azimuth: 8, polar: 30, narrow: 1.7 }

/** Какую главу открывает узел по клику. */
export const NODE_CHAPTER: Record<NodeId, number> = {
  client: 6,
  site: 1,
  bot: 2,
  crm: 3,
  db: 3,
  stream: 4,
  queue: 4,
  parser: 5,
  llm: 5,
  booking: 7,
  shop: 8,
  assistant: 9,
  sync: 10,
  prices: 11,
  billing: 12,
}

/** Какие услуги подписаны у узла: номера строк `offer.items` в контенте. */
export const NODE_OFFERS: Record<NodeId, number[]> = {
  client: [],
  site: [0, 1],
  bot: [2],
  crm: [3],
  parser: [4],
  llm: [5],
  stream: [6],
  db: [7],
  queue: [8],
  booking: [9],
  shop: [10],
  assistant: [11],
  sync: [12],
  prices: [13],
  billing: [14],
}

/** Глава, в которой услуга уже работает: по номеру строки `offer.items`. */
export const OFFER_CHAPTER: number[] = NODE_IDS.flatMap((id) => NODE_OFFERS[id].map((offer) => [offer, NODE_CHAPTER[id]]))
  .sort((a, b) => a[0] - b[0])
  .map(([, chapter]) => chapter)

/** Кратчайший маршрут по связям, без учёта направления. */
export function route(from: NodeId, to: NodeId): NodeId[] {
  if (from === to) return [from]
  const previous = new Map<NodeId, NodeId>()
  const queue: NodeId[] = [from]
  const seen = new Set<NodeId>([from])
  while (queue.length > 0) {
    const current = queue.shift() as NodeId
    for (const edge of EDGES) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null
      if (!next || seen.has(next)) continue
      seen.add(next)
      previous.set(next, current)
      if (next === to) {
        const result: NodeId[] = [to]
        while (result[0] !== from) result.unshift(previous.get(result[0]) as NodeId)
        return result
      }
      queue.push(next)
    }
  }
  return [from]
}

