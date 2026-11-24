/** «Выбрать» у услуги отмечает её в карточке заявки внизу страницы. */
const EVENT = 'addictcode:pick'

export function pickService(index: number): void {
  window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: index }))
  document.getElementById('contact')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

export function onPickService(fn: (index: number) => void): () => void {
  const handler = (event: Event) => fn((event as CustomEvent<number>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
