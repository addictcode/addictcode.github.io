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
