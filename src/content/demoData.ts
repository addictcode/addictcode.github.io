/** Выдуманные данные для демо «Монитор объявлений». Бренды не существуют. */
export const monitorBrands = ['Nordvik', 'Kalda', 'Remo', 'Aster'] as const
export const monitorSizes = ['S', 'M', 'L', 'XL'] as const
export const monitorPrices = [15, 25, 40, 60] as const
export const monitorCurrency = '€'
/** сколько объявлений проходит за один прогон */
export const monitorRunLength = 36

/** условные заявки по дням недели для дашборда демо «Заявка → бот → CRM» */
export const leadWeekSeed = [3, 5, 2, 6, 4, 1, 0] as const
export const leadFirstNumber = 1042

/** Демо-прототипы: цены и расписание выдуманы. */
export const bookingPrices = [20, 45, 25] as const
export const bookingSlots = ['10:00', '11:30', '13:00', '15:30', '17:00'] as const
/** занятые слоты первого дня: [услуга, слот] */
export const bookingSeed = [
  [0, 1],
  [2, 3],
] as const
export const shopPrices = [14, 9, 22, 6, 12, 28] as const
export const shopFirstOrder = 2051
export const crmFirstLead = 310
export const pricesMine = [59, 42, 19, 8, 12] as const
export const planPrices = [9, 29, 79] as const
/** тарифы выдуманных пользователей в админке кабинета */
export const cabinetSeedPlans = [0, 1, 1] as const
