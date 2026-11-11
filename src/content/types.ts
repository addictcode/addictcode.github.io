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
    tryDemo: string
    node: string
  }
  /** названия глав: подписи в навигации */
  chapters: string[]
  hero: {
    name: string
    role: string
    title: string
    phrase: string
    /** подсказка про карту: для экрана с картой справа и для телефона */
    hint: string
    hintTouch: string
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
    takeTitle: string
    take: string[]
    processTitle: string
    process: { name: string; text: string }[]
    footer: string
  }
  /** подписи карты системы и журнала событий */
  system: {
    note: string
    hudTitle: string
    live: string
    session: string
    events: string
    pingHint: string
    log: {
      boot: string
      move: string
      click: string
      lang: string
      ping: string
      pingText: string
      lead: string
      match: string
      search: string
      monitor: string
      monitorStart: string
      monitorDone: string
    }
  }
}
