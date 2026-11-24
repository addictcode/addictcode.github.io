/**
 * Статичная версия: без закреплённых сцен и анимации по скроллу, тот же текст.
 * Включается при prefers-reduced-motion и параметром `?static`.
 */
export function prefersStatic(): boolean {
  if (new URLSearchParams(location.search).has('static')) return true
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}
