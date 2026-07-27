// Brauzerin az-AZ lokalı ayları "M07" kimi qaytardığı üçün ay/gün adlarını özümüz saxlayırıq.

export const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
]

// Həftə bazar ertəsindən başlayır (təqvim gridi ilə eyni sıra)
export const WEEKDAYS_SHORT = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B']

const parse = (value) => (value instanceof Date ? value : new Date(value))

// 2026-07-28 → "28 iyul"
export const formatDate = (value) => {
  const d = parse(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

// 2026-07-28 → "28 iyul 2026"
export const formatDateFull = (value) => {
  const d = parse(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Təqvim başlığı: "İyul 2026"
export const formatMonthTitle = (year, month) => {
  const name = MONTHS[month]
  return `${name.charAt(0).toLocaleUpperCase('az')}${name.slice(1)} ${year}`
}

// Tarixin həftə günü qısaltması (bazar ertəsi = 0)
export const weekdayShort = (date) => WEEKDAYS_SHORT[(parse(date).getDay() + 6) % 7]
