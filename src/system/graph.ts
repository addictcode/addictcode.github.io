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

/**
 * Карта разложена по пяти колонкам-дорожкам, как схема архитектуры:
 * слева вход, справа то, что система отдаёт наружу. Узлы стоят на сетке
 * с шагом 10–12, связи идут шинами по рядам и колонкам.
 */
const COL = { ingress: -22, interfaces: -10, core: 2, workers: 12, outputs: 22 } as const
const ROW = { top: -11, bus: -2, data: 7, bottom: 15 } as const

export const NODES: Record<NodeId, NodeDef> = {
  client: { x: COL.ingress, z: ROW.bus, label: 'client' },
  site: { x: COL.interfaces, z: ROW.bus, label: 'site' },
  bot: { x: COL.interfaces, z: ROW.data, label: 'bot' },
  crm: { x: COL.core, z: ROW.bus, label: 'crm' },
  db: { x: COL.core, z: ROW.data, label: 'postgres' },
  stream: { x: COL.outputs, z: ROW.data, label: 'stream' },
  queue: { x: COL.workers, z: ROW.data, label: 'queue' },
  parser: { x: COL.workers, z: ROW.top, label: 'parser' },
  llm: { x: COL.workers, z: ROW.bus, label: 'llm' },
  booking: { x: COL.interfaces + 4, z: ROW.bottom, label: 'booking' },
  shop: { x: COL.interfaces - 4, z: ROW.bottom, label: 'shop' },
  assistant: { x: COL.outputs, z: ROW.bus, label: 'assistant' },
  sync: { x: COL.interfaces, z: ROW.top, label: 'crm-sync' },
  prices: { x: COL.outputs, z: ROW.top, label: 'prices' },
  billing: { x: COL.core, z: ROW.bottom, label: 'billing' },
}

export type Point = [x: number, z: number]

interface EdgeDef {
  from: NodeId
  to: NodeId
  /** ломаная под прямыми углами от узла к узлу; углы скашиваются в `edgePoints` */
  path: Point[]
}

const at = (id: NodeId): Point => [NODES[id].x, NODES[id].z]
/** развилка под ботом: от неё связи расходятся к записи и магазину */
const FORK = ROW.data + 4

export const EDGES: EdgeDef[] = [
  { from: 'client', to: 'site', path: [at('client'), at('site')] },
  { from: 'client', to: 'bot', path: [at('client'), [COL.ingress, ROW.data], at('bot')] },
  { from: 'site', to: 'sync', path: [at('site'), at('sync')] },
  { from: 'site', to: 'bot', path: [at('site'), at('bot')] },
  { from: 'site', to: 'crm', path: [at('site'), at('crm')] },
  { from: 'bot', to: 'db', path: [at('bot'), at('db')] },
  { from: 'crm', to: 'db', path: [at('crm'), at('db')] },
  { from: 'llm', to: 'crm', path: [at('llm'), at('crm')] },
  { from: 'parser', to: 'llm', path: [at('parser'), at('llm')] },
  { from: 'parser', to: 'prices', path: [at('parser'), at('prices')] },
  { from: 'llm', to: 'assistant', path: [at('llm'), at('assistant')] },
  { from: 'db', to: 'queue', path: [at('db'), at('queue')] },
  { from: 'queue', to: 'stream', path: [at('queue'), at('stream')] },
  { from: 'db', to: 'billing', path: [at('db'), at('billing')] },
  { from: 'bot', to: 'booking', path: [at('bot'), [COL.interfaces, FORK], [NODES.booking.x, FORK], at('booking')] },
  { from: 'bot', to: 'shop', path: [at('bot'), [COL.interfaces, FORK], [NODES.shop.x, FORK], at('shop')] },
]

/** насколько скашивается угол ломаной */
const CHAMFER = 1.4

/** Точки связи со скошенными углами: по ним рисуется дорожка и идут пакеты. */
export function edgePoints(path: Point[]): Point[] {
  const out: Point[] = [path[0]]
  for (let i = 1; i < path.length - 1; i += 1) {
    const [px, pz] = path[i - 1]
    const [cx, cz] = path[i]
    const [nx, nz] = path[i + 1]
    const inLength = Math.hypot(cx - px, cz - pz)
    const outLength = Math.hypot(nx - cx, nz - cz)
    const r = Math.min(CHAMFER, inLength / 2, outLength / 2)
    out.push([cx - ((cx - px) / inLength) * r, cz - ((cz - pz) / inLength) * r])
    out.push([cx + ((nx - cx) / outLength) * r, cz + ((nz - cz) / outLength) * r])
  }
  out.push(path[path.length - 1])
  return out
}

/** Точка на ломаной на расстоянии `dist` от начала. */
export function pointAlong(points: Point[], dist: number): Point {
  let rest = dist
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, az] = points[i]
    const [bx, bz] = points[i + 1]
    const length = Math.hypot(bx - ax, bz - az)
    if (rest <= length || i === points.length - 2) {
      const f = length === 0 ? 0 : Math.min(1, rest / length)
      return [ax + (bx - ax) * f, az + (bz - az) * f]
    }
    rest -= length
  }
  return points[points.length - 1]
}

export const pathLength = (points: Point[]): number =>
  points.slice(1).reduce((sum, [x, z], i) => sum + Math.hypot(x - points[i][0], z - points[i][1]), 0)

/** Колонки-дорожки карты: границы по x и подпись, напечатанная на «полу» у дальнего края. */
export interface Lane {
  from: number
  to: number
  label: string
}

export const LANES: Lane[] = [
  { from: -27, to: -16, label: '01 ingress' },
  { from: -16, to: -4, label: '02 interfaces' },
  { from: -4, to: 7, label: '03 core' },
  { from: 7, to: 17, label: '04 workers' },
  { from: 17, to: 27, label: '05 outputs' },
]
/** дорожки тянутся от дальнего края карты до ближнего */
export const LANE_Z: [far: number, near: number] = [-20.5, 21]

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
/** Сколько первых строк `offer.items` подтверждены готовыми проектами; остальные — демо-прототипы. */
export const REAL_OFFERS = 9
/** Разделы главной: по ним ходит навигация в шапке. */
export const SECTIONS = ['services', 'projects', 'demos', 'contact'] as const

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
  { x: 0, z: 1, dist: 60, azimuth: 26, polar: 55, narrow: 1.35 },
  { x: -10, z: -2, dist: 23, azimuth: 18, polar: 56, narrow: 1.25 },
  { x: -10, z: 7, dist: 23, azimuth: -26, polar: 57, narrow: 1.25 },
  { x: 2, z: 2.5, dist: 29, azimuth: 30, polar: 54, narrow: 1.3 },
  { x: 17, z: 7, dist: 30, azimuth: -30, polar: 55, narrow: 1.55 },
  { x: 12, z: -6.5, dist: 29, azimuth: 22, polar: 56, narrow: 1.4 },
  { x: -8, z: 2, dist: 48, azimuth: -44, polar: 58, narrow: 1.4 },
  { x: -6, z: 15, dist: 22, azimuth: 26, polar: 56, narrow: 1.25 },
  { x: -14, z: 15, dist: 22, azimuth: -24, polar: 57, narrow: 1.25 },
  { x: 22, z: -2, dist: 22, azimuth: -30, polar: 56, narrow: 1.25 },
  { x: -10, z: -11, dist: 22, azimuth: 30, polar: 56, narrow: 1.25 },
  { x: 22, z: -11, dist: 22, azimuth: 20, polar: 57, narrow: 1.25 },
  { x: 2, z: 15, dist: 22, azimuth: -32, polar: 56, narrow: 1.25 },
]


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

