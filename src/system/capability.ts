export type StageMode = 'live' | 'static'

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function isWeakDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true
  return typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2
}

/**
 * Живая 3D-карта или статичные кадры с тем же текстом.
 * Дешёвые признаки проверяются сразу; WebGL — отдельно, перед загрузкой сцены,
 * потому что создание контекста само по себе стоит времени.
 */
export function pickStageMode(): StageMode {
  const params = new URLSearchParams(location.search)
  if (params.has('static')) return 'static'
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'
  if (isWeakDevice() && !params.has('live')) return 'static'
  return 'live'
}
