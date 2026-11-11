/** Геометрия кадра, общая для 3D-сцены и статичных постеров. */

export const DESKTOP_MIN_WIDTH = 960
/** расстояние между станциями в единицах сцены */
export const STATION_SPACING = 14
/** сколько единиц сцены по ширине и высоте помещается в постер */
export const POSTER_UNITS = 24

export interface Framing {
  /** пикселей на единицу сцены */
  zoom: number
  /** точка экрана, в которой должна стоять посылка */
  anchorX: number
  anchorY: number
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function getFraming(width: number, height: number, progress: number): Framing {
  if (width >= DESKTOP_MIN_WIDTH) {
    // те же формулы, что у --sheet-left и --sheet-w в CSS
    const sheetRight = Math.max(32, width * 0.06) + Math.min(560, width * 0.42)
    return {
      zoom: clamp(Math.min((width - sheetRight) / 19, height / 20), 26, 72),
      anchorX: sheetRight + (width - sheetRight) * 0.42,
      anchorY: height * 0.64,
    }
  }
  // на телефоне в приёмке сцена под текстом, дальше в «окне» над листом
  const k = clamp(progress * 1.4, 0, 1)
  return {
    zoom: clamp(width / 12, 24, 56),
    anchorX: width * 0.44,
    anchorY: height * (0.85 + (0.38 - 0.85) * k),
  }
}
