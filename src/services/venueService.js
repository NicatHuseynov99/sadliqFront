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
