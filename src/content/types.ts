export type Lang = 'ru' | 'en'

export type WorkId = 'dealer' | 'crm' | 'vinted' | 'tender' | 'pulse' | 'engine'

export interface Work {
  id: WorkId
  title: string
  /** что это за проект: заказ, открытый код, демо-данные */
  meta: string
  tags: string[]
  lead: string
  facts: string[]
  stack: string
}

export interface Service {
  name: string
  /** кому подходит */
  forWho: string
  /** что входит в основной пакет */
  points: string[]
  price: string
  time: string
  /** где это уже работает */
  proof: string
}

export interface Step {
  name: string
  title: string
  text: string
  /** где это уже работает: факт из кейса */
  proof: string
}

export interface Content {
  meta: { title: string; description: string }
  ui: {
    skip: string
    nav: { services: string; works: string; terms: string; contact: string }
    navLabel: string
    langSwitch: string
    cta: string
    telegram: string
    github: string
    code: string
    liveDemo: string
    external: string
    open: string
    close: string
  }
  hero: {
    eyebrow: string
    /** заголовок: текст до слова-карточки, само слово, текст после */
    before: string
    chip: string
    after: string
    lead: string
    secondary: string
    cue: string
  }
  story: {
    label: string
    steps: [Step, Step, Step]
    outro: { title: string; text: string }
    form: { title: string; name: string; nameValue: string; task: string; taskValue: string; source: string; sourceValue: string; send: string; sent: string }
    note: { chat: string; bot: string; now: string; title: string; reply: string; copy: string }
    board: { title: string; columns: [string, string, string, string, string]; paid: string }
  }
  services: {
    label: string
    title: string
    lead: string
    items: Service[]
    choose: string
    note: string
  }
  terms: {
    label: string
    title: string
    steps: { name: string; text: string }[]
    rules: string[]
  }
  faq: {
    label: string
    title: string
    items: { q: string; a: string }[]
  }
  stack: string[]
  works: {
    label: string
    title: string
    lead: string
    items: Work[]
    search: { label: string; hint: string; understood: string; found: string; empty: string; catalog: string[] }
  }
  contact: {
    label: string
    /** заголовок: текст до слова-карточки, само слово, текст после */
    title: [string, string, string]
    lead: string
    card: string
    needsLabel: string
    needs: string[]
    aboutLabel: string
    aboutPlaceholder: string
    send: string
    hint: string
    message: { hello: string; need: string; about: string }
    or: string
  }
  footer: string
}
