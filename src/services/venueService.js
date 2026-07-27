// Saray məlumatları üçün MOCK servis qatı.
// Hər funksiyanın üstündə uyğun real endpoint yazılıb — API qoşulanda yalnız bu fayl dəyişəcək,
// səhifələrdəki çağırışlar olduğu kimi qalacaq.

import { venues, busyDates } from '@/data/mockData'
import { getActiveReservationDates } from '@/services/reservationService'

// Şəbəkə gecikməsini imitasiya edir ki, loading vəziyyətləri realdakı kimi görünsün
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Real: GET /Venues/GetAll
export const getAllVenues = async () => {
  await delay()
  return venues
}

// Real: GET /Venues/GetById/{id}
export const getVenueById = async (id) => {
  await delay()
  const venue = venues.find((v) => v.id === Number(id))
  if (!venue) throw new Error('Saray tapılmadı.')
  return venue
}

// Real: GET /Halls/GetAvailability/{hallId} — zalın bağlı (dolu/tutulmuş) günləri
export const getHallBusyDates = async (hallId) => {
  await delay(150)
  const preset = busyDates[hallId] ?? []
  const reserved = getActiveReservationDates(hallId)
  return new Set([...preset, ...reserved])
}

// Tarixi YYYY-MM-DD formatına salır (yerli vaxt zonasına görə, UTC sürüşməsi olmadan)
export const toDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Bütün zalların dolu günlərini bir dəfəyə yükləyir: { hallId: Set(tarixlər) }
// Filtrləmə zamanı hər saray üçün ayrıca sorğu göndərməmək üçün istifadə olunur
export const getAllBusyDates = async () => {
  await delay(150)
  const map = {}
  for (const venue of venues) {
    for (const hall of venue.halls) {
      const preset = busyDates[hall.id] ?? []
      map[hall.id] = new Set([...preset, ...getActiveReservationDates(hall.id)])
    }
  }
  return map
}

// Sarayın bütün zallarını yoxlayaraq bu gündən sonrakı ən yaxın boş günü tapır
export const getNearestFreeDate = async (venue, daysAhead = 120) => {
  const busySets = await Promise.all(venue.halls.map((h) => getHallBusyDates(h.id)))

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < daysAhead; i++) {
    const key = toDateKey(cursor)
    // Ən azı bir zal həmin gün boşdursa, saray həmin tarixdə mövcud sayılır
    if (busySets.some((set) => !set.has(key))) return key
    cursor.setDate(cursor.getDate() + 1)
  }

  return null
}
