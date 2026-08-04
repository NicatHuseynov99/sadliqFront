// Rezervasiya API servis qatı.
// Status kodları backend ReservationStatus enum-u ilə eynidir:
// 0 = Pending (Gözləyir), 1 = Confirmed (Təsdiqlənib), 2 = Rejected (Rədd edilib), 3 = Ləğv edilib

import api from '@/services/api'

// Backend rezervini frontend-in gözlədiyi düz quruluşa çevirir
const mapReservation = (r) => ({
  id: r.id,
  venueId: r.venueId,
  venueName: r.venue?.name ?? '',
  venueCity: r.venue?.city ?? '',
  venueImage: r.venue?.coverImageUrl ?? '',
  hallId: r.hallId,
  hallName: r.hall?.name ?? '',
  menuId: r.menuId,
  menuName: r.menu?.name ?? '',
  pricePerPerson: r.menu?.pricePerPerson ?? 0,
  eventDate: r.eventDate,
  guestCount: r.guestCount,
  contactPhone: r.contactPhone,
  note: r.note,
  status: r.status,
  createdAt: r.createdAt,
  seenAt: r.seenAt,

  // Sahibin göndərdiyi, cavab gözləyən əks-təklif
  counterOffer: (r.counterOffers ?? []).find((o) => o.status === 0) ?? null,
})

// POST /Reservations/Create — yeni rezerv sorğusu göndərir
export const createReservation = async (dto) => {
  const { data } = await api.post('/Reservations/Create', {
    venueId: dto.venueId,
    hallId: dto.hallId,
    menuId: dto.menuId,
    eventDate: dto.eventDate,
    guestCount: dto.guestCount,
    contactPhone: dto.contactPhone,
    note: dto.note,
  })
  return { data: data.data, message: data.message ?? 'Rezerv sorğusu göndərildi.' }
}

// GET /Reservations/GetMine — müştərinin öz rezervləri (yenilər yuxarıda)
export const getMyReservations = async () => {
  const { data } = await api.get('/Reservations/GetMine')
  return (data.data ?? []).map(mapReservation).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// PUT /Reservations/Cancel/{id} — rezervi ləğv edir, günü yenidən boşaldır
export const cancelReservation = async (id) => {
  const { data } = await api.put(`/Reservations/Cancel/${id}`)
  return { message: data.message ?? 'Rezerv ləğv edildi.' }
}

// PUT /Reservations/AcceptCounterOffer/{id} — sahibin təklifini qəbul edir
export const acceptCounterOffer = async (offerId) => {
  const { data } = await api.put(`/Reservations/AcceptCounterOffer/${offerId}`)
  return data.message ?? 'Təklif qəbul edildi.'
}

// PUT /Reservations/DeclineCounterOffer/{id}
export const declineCounterOffer = async (offerId) => {
  const { data } = await api.put(`/Reservations/DeclineCounterOffer/${offerId}`)
  return data.message ?? 'Təklif rədd edildi.'
}
