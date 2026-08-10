// Restoran rəhbərliyi (Owner) paneli üçün API servis qatı.
// Bütün sorğular JWT token tələb edir — token axios interceptor-u tərəfindən əlavə olunur.

import api from '@/services/api'

// GET /Venues/GetMine — sahibin öz sarayları (təsdiqlənməmişlər də daxil)
export const getMyVenues = async () => {
  const { data } = await api.get('/Venues/GetMine')
  return (data.data ?? []).map((v) => ({
    ...v,
    hallCount: v.halls?.length ?? 0,
    menuCount: v.menus?.length ?? 0,
  }))
}

// Backend rezervini panelin gözlədiyi düz quruluşa çevirir
const mapReservation = (r) => ({
  id: r.id,
  venueId: r.venueId,
  hallName: r.hall?.name ?? '',
  hallCapacity: r.hall?.capacity ?? 0,
  menuName: r.menu?.name ?? '',
  pricePerPerson: r.menu?.pricePerPerson ?? 0,
  customerName: r.customer?.fullName ?? 'Müştəri',
  customerEmail: r.customer?.email ?? '',
  eventDate: r.eventDate,
  guestCount: r.guestCount,
  contactPhone: r.contactPhone,
  note: r.note,
  status: r.status,
  createdAt: r.createdAt,
  seenAt: r.seenAt,
  hallId: r.hallId,
  menuId: r.menuId,

  // Bizim göndərdiyimiz, müştərinin cavabını gözləyən təklif
  counterOffer:
    (r.counterOffers ?? []).find((o) => o.status === 0 && !o.isFromCustomer) ?? null,

  // Müştərinin göndərdiyi, bizim cavabımızı gözləyən təklif
  customerOffer:
    (r.counterOffers ?? []).find((o) => o.status === 0 && o.isFromCustomer) ?? null,
})

// GET /Reservations/GetForOwner — bütün sarayların rezervləri tək sorğu ilə,
// saray Id-sinə görə qruplaşdırılmış halda qaytarılır
export const getOwnerReservations = async () => {
  const { data } = await api.get('/Reservations/GetForOwner')

  const grouped = {}
  for (const raw of data.data ?? []) {
    const reservation = mapReservation(raw)
    ;(grouped[reservation.venueId] ??= []).push(reservation)
  }
  return grouped
}

// GET /Reservations/GetByVenue/{venueId} — tək sarayın rezervləri (siyahını yeniləmək üçün)
export const getVenueReservations = async (venueId) => {
  const { data } = await api.get(`/Reservations/GetByVenue/${venueId}`)
  return (data.data ?? []).map(mapReservation).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// ============ Saray, zal və menyu idarəetməsi (yalnız Owner) ============

// POST /Venues/Create
export const createVenue = async (payload) => {
  const { data } = await api.post('/Venues/Create', payload)
  return { venue: data.data, message: data.message ?? 'Saray əlavə olundu.' }
}

// PUT /Venues/Update/{id}
export const updateVenue = async (id, payload) => {
  const { data } = await api.put(`/Venues/Update/${id}`, payload)
  return data.message ?? 'Saray yeniləndi.'
}

// DELETE /Venues/Delete/{id}
export const deleteVenue = async (id) => {
  const { data } = await api.delete(`/Venues/Delete/${id}`)
  return data.message ?? 'Saray silindi.'
}

// GET /Halls/GetByVenue/{venueId}
export const getVenueHalls = async (venueId) => {
  const { data } = await api.get(`/Halls/GetByVenue/${venueId}`)
  return (data.data ?? []).map((h) => ({ ...h, imageUrl: h.media?.[0]?.url ?? '' }))
}

export const createHall = async (payload) => {
  const { data } = await api.post('/Halls/Create', payload)
  return data.message ?? 'Zal əlavə olundu.'
}

export const updateHall = async (id, payload) => {
  const { data } = await api.put(`/Halls/Update/${id}`, payload)
  return data.message ?? 'Zal yeniləndi.'
}

export const deleteHall = async (id) => {
  const { data } = await api.delete(`/Halls/Delete/${id}`)
  return data.message ?? 'Zal silindi.'
}

// PUT /Halls/SetAvailability/{hallId} — günü əl ilə bağlamaq/açmaq
// Status: 0 = Boş, 1 = Dolu, 2 = Tutulub
export const setHallDayStatus = async (hallId, date, status) => {
  const { data } = await api.put(`/Halls/SetAvailability/${hallId}`, { date, status })
  return data.message ?? 'Təqvim yeniləndi.'
}

// GET /Menus/GetByVenue/{venueId}
export const getVenueMenus = async (venueId) => {
  const { data } = await api.get(`/Menus/GetByVenue/${venueId}`)
  return data.data ?? []
}

export const createMenu = async (payload) => {
  const { data } = await api.post('/Menus/Create', payload)
  return data.message ?? 'Menyu əlavə olundu.'
}

export const updateMenu = async (id, payload) => {
  const { data } = await api.put(`/Menus/Update/${id}`, payload)
  return data.message ?? 'Menyu yeniləndi.'
}

export const deleteMenu = async (id) => {
  const { data } = await api.delete(`/Menus/Delete/${id}`)
  return data.message ?? 'Menyu silindi.'
}

// ============ Saray administratorları (yalnız Owner) ============

// GET /VenueStaff/GetMine
export const getMyStaff = async () => {
  const { data } = await api.get('/VenueStaff/GetMine')
  return data.data ?? []
}

// POST /VenueStaff/Create — yeni administrator hesabı yaradıb saraya təyin edir
export const createStaff = async (payload) => {
  const { data } = await api.post('/VenueStaff/Create', payload)
  return { staff: data.data, message: data.message }
}

// PUT /VenueStaff/Update/{id} — ad, soyad və telefon
export const updateStaff = async (id, payload) => {
  const { data } = await api.put(`/VenueStaff/Update/${id}`, payload)
  return data.message
}

// PUT /VenueStaff/SetHalls/{id} — administratorun işləyə biləcəyi zallar (boş = hamısı)
export const setStaffHalls = async (id, hallIds) => {
  const { data } = await api.put(`/VenueStaff/SetHalls/${id}`, { hallIds })
  return data.message
}

// PUT /VenueStaff/SetPermissions/{id} — administratorun səlahiyyətləri.
// Hamısı söndürülsə administrator yalnız sorğuları görür.
export const setStaffPermissions = async (id, permissions) => {
  const { data } = await api.put(`/VenueStaff/SetPermissions/${id}`, permissions)
  return data.message
}

// GET /OwnerStats/ActivityLog — sahibin öz sarayları üzrə fəaliyyət jurnalı
export const getOwnerActivityLog = async (params) => {
  const { data } = await api.get('/OwnerStats/ActivityLog', { params })
  const paged = data.data ?? {}

  return {
    items: (paged.items ?? []).map((a) => ({
      id: a.id,
      userName: a.userFullName,
      action: a.action,
      description: a.description,
      createdAt: a.createdAt,
      isSuccess: a.isSuccess,
    })),
    totalCount: paged.totalCount ?? 0,
    page: paged.page ?? 1,
  }
}

// DELETE /VenueStaff/Delete/{id} — təyinatı siyahıdan silir
export const deleteStaff = async (id) => {
  const { data } = await api.delete(`/VenueStaff/Delete/${id}`)
  return data.message
}

// PUT /VenueStaff/SetActive/{id}?isActive=true|false
export const setStaffActive = async (id, isActive) => {
  const { data } = await api.put(`/VenueStaff/SetActive/${id}`, null, { params: { isActive } })
  return data.message
}

// PUT /VenueStaff/ResetPassword/{id}
export const resetStaffPassword = async (id, newPassword) => {
  const { data } = await api.put(`/VenueStaff/ResetPassword/${id}`, { newPassword })
  return data.message
}

// PUT /Reservations/MarkSeen/{id} — müştəri «baxıldı» görsün
export const markReservationSeen = async (id) => {
  await api.put(`/Reservations/MarkSeen/${id}`)
}

// POST /Reservations/CreateCounterOffer — «rədd» əvəzinə başqa şərt təklif etmək
export const createCounterOffer = async (dto) => {
  const { data } = await api.post('/Reservations/CreateCounterOffer', dto)
  return data.message ?? 'Əks-təklif göndərildi.'
}

// PUT /Reservations/AcceptCustomerOffer/{id} — müştərinin təklifini qəbul edir,
// şərtlər rezervə köçürülür və rezerv təsdiqlənir
export const acceptCustomerOffer = async (offerId) => {
  const { data } = await api.put(`/Reservations/AcceptCustomerOffer/${offerId}`)
  return data.message ?? 'Təklif qəbul edildi.'
}

// PUT /Reservations/DeclineCustomerOffer/{id} — sorğu açıq qalır
export const declineCustomerOffer = async (offerId) => {
  const { data } = await api.put(`/Reservations/DeclineCustomerOffer/${offerId}`)
  return data.message ?? 'Təklif rədd edildi.'
}

// PUT /Reservations/UpdateStatus/{id} — 1 = təsdiqlə, 2 = rədd et, 3 = ləğv et.
// Təsdiqlənmiş tədbir ləğv olunursa səbəb məcburidir.
export const updateReservationStatus = async (id, status, reason = null) => {
  const { data } = await api.put(`/Reservations/UpdateStatus/${id}`, { status, reason })
  return data.message ?? 'Status yeniləndi.'
}

// GET /OwnerStats/Get — sahibkarın hesabatı
export const getOwnerStats = async (days = 30, venueId = null) => {
  const { data } = await api.get('/OwnerStats/Get', { params: { days, venueId } })
  return data.data ?? []
}
