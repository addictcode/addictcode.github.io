import type { labRu } from './lab.ru'

export type Lang = 'ru' | 'en'

export interface Fact {
  /** короткая метка слева */
  k: string
  text: string
}

export interface MetaRow {
  label: string
  value: string
}

export interface CaseContent {
  kicker: string
  title: string
  lead: string
  facts: Fact[]
  /** остальное одной строкой, чтобы не раздувать список */
  more?: string
  stack: MetaRow[]
}

export interface Content {
  meta: { title: string; description: string }
  ui: {
    skip: string
    chapterNav: string
    langSwitch: string
    telegram: string
    github: string
    repo: string
    liveDemo: string
    demo: string
    externalHint: string
    stageAlt: string
    more: string
    close: string
    back: string
    projects: string
    openProject: string
  }
  /** названия глав: подписи в навигации */
  chapters: string[]
  hero: {
    role: string
    title: string
    phrase: string
    cta: string
    hint: string
  }
  site: CaseContent & {
    mock: {
      caption: string
      searchLabel: string
      searchPlaceholder: string
      understood: string
      found: string
      empty: string
      catalog: string[]
    }
  }
  bot: CaseContent & {
    monitor: {
      title: string
      note: string
      brand: string
      anyBrand: string
      size: string
      anySize: string
      priceTo: string
      start: string
      stop: string
      restart: string
      checked: string
      found: string
      feed: string
      alerts: string
      idle: string
      noAlerts: string
      done: string
      newListing: string
      items: string[]
      botName: string
    }
  }
  crm: CaseContent & {
    pipelineLabel: string
    pipeline: string[]
    mock: {
      caption: string
      title: string
      crews: string[]
      days: string[]
      legend: string[]
    }
  }
  realtime: {
    title: string
    lead: string
    pulse: CaseContent & { imageAlt: string }
    engine: CaseContent
  }
  parsing: CaseContent & {
    shots: { alt: string; caption: string }[]
    shotsNote: string
  }
  lead: {
    title: string
    intro: string
    disclaimer: string
    form: {
      legend: string
      name: string
      namePlaceholder: string
      need: string
      needs: string[]
      budget: string
      budgets: string[]
      submit: string
      again: string
    }
    steps: string[]
    bot: { title: string; botName: string; empty: string; newLead: string; from: string; need: string; budget: string }
    crm: { title: string; cols: string[]; statusNew: string; statusQueued: string; seed: { name: string; need: string; status: string }[] }
    dash: { title: string; today: string; total: string; days: string[]; caption: string }
    done: string
  }
  skills: {
    title: string
    lead: string
    groups: { name: string; items: string[] }[]
  }
  contact: {
    title: string
    lead: string
    stackLabel: string
    footer: string
  }
  /** услуги: порядок совпадает с `OFFER_CHAPTER` в `src/system/graph.ts` */
  offer: {
    title: string
    hint: string
    items: { name: string; text: string }[]
  }
  /** страница «Демо»: прототипы на выдуманных данных */
  lab: typeof labRu
}
