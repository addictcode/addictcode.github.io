/** Геометрия кадра, общая для 3D-сцены и статичных постеров. */

export const DESKTOP_MIN_WIDTH = 960
/** сколько единиц сцены по ширине и высоте помещается в постер */
export const POSTER_UNITS = 13

export interface Framing {
  /** пикселей на единицу сцены */
  zoom: number
  /** точка экрана, в которой стоит центр фигуры */
  anchorX: number
  anchorY: number
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function getFraming(width: number, height: number, progress: number): Framing {
  if (width >= DESKTOP_MIN_WIDTH) {
    // те же формулы, что у --col-left и --col-w в CSS
    const textRight = Math.max(40, width * 0.07) + Math.min(600, width * 0.44)
    const free = width - textRight
    return {
      zoom: clamp(Math.min(free / 13.6, height / 12.5), 22, 90),
      anchorX: textRight + free * 0.47,
      anchorY: height * 0.53,
    }
  }
  // на телефоне в начале фигура под текстом, дальше в «окне» над текстом главы
  const k = clamp(progress * 1.4, 0, 1)
  return {
    // в начале над фигурой весь первый экран текста, поэтому она мельче
    zoom: clamp(width / (16.5 - 5 * k), 18, 60),
    anchorX: width * 0.5,
    anchorY: height * (0.85 + (0.36 - 0.85) * k),
  }
}
