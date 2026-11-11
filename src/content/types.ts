export type Lang = 'ru' | 'en'

export interface Fact {
  /** короткая метка слева, моноширинная */
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
  meta: MetaRow[]
  facts: Fact[]
}

export interface StationInfo {
  /** подпись в навигации и на вывеске станции */
  name: string
  /** текст штампа на посылке */
  stamp: string
}

export interface Content {
  meta: { title: string; description: string }
  ui: {
    skip: string
    station: string
    stationNav: string
    langSwitch: string
    telegram: string
    github: string
    repo: string
    liveDemo: string
    demo: string
    externalHint: string
    stageAlt: string
    brand: string
  }
  stations: StationInfo[]
  hero: {
    firstName: string
    lastName: string
    role: string
    phrase: string
    label: MetaRow[]
    hint: string
    tracking: string
  }
  site: CaseContent & {
    mock: {
      caption: string
      searchLabel: string
      searchPlaceholder: string
      understood: string
      nav: string[]
      filters: string[]
      item: string
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
      roles: string[]
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
    containerLabel: string
    containers: { code: string; name: string; items: string[] }[]
  }
  delivery: {
    title: string
    lead: string
    takeTitle: string
    take: string[]
    processTitle: string
    process: { name: string; text: string }[]
    contactTitle: string
    telegramNote: string
    githubNote: string
    stamp: string
    footer: string
  }
}
