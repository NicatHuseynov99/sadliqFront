// Saray məlumatları üçün API servis qatı.
// Backend entity-lərini frontend-in gözlədiyi formaya çevirir (rating, features, images,
// dolu günlər kimi sahələr burada hazırlanır ki, səhifələr dəyişməsin).
//
// Dolu günlər artıq GetAll/GetById cavabının içində gəlir — hər zal üçün ayrıca
// GetAvailability sorğusu göndərilmir.

import api from '@/services/api'

// Tarixi YYYY-MM-DD formatına salır (yerli vaxt zonasına görə, UTC sürüşməsi olmadan)
export const toDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Backend-dən gələn sarayı frontend modelinə çevirir
const mapVenue = (v) => {
  const reviews = (v.reviews ?? []).map((r) => ({
    id: r.id,
    author: r.authorName,
    rating: r.rating,
    text: r.comment,
    date: (r.createdAt ?? '').slice(0, 10),
  }))

  const rating = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  return {
    ...v,
    features: (v.features ?? []).map((f) => f.name),
    images: (v.images ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url),
    halls: (v.halls ?? []).map((h) => ({
      ...h,
      // Zalın əsas şəkli media siyahısının ilk elementidir
      imageUrl: h.media?.[0]?.url ?? v.coverImageUrl,
      // Backend yalnız boş olmayan (Booked/Held) günləri göndərir
      busyDates: new Set((h.availability ?? []).map((a) => a.date)),
    })),
    menus: (v.menus ?? []).map((m) => ({
      ...m,
      coverImageUrl: m.imageUrl,
      items: m.items ?? [],
    })),
    reviews,
    rating,
    reviewCount: reviews.length,
  }
}

// GET /Venues/GetAll — ana səhifənin bütün datası tək sorğu ilə gəlir
export const getAllVenues = async () => {
  const { data } = await api.get('/Venues/GetAll')
  return (data.data ?? []).map(mapVenue)
}

// GET /Venues/Search — filtr + sıralama + səhifələmə (sonsuz scroll üçün)
// params: { q, city, date, minPrice, maxPrice, capacity, sort, page, pageSize }
export const searchVenues = async (params) => {
  // indexes: null → massivlər features=a&features=b kimi göndərilir (ASP.NET bu formatı gözləyir)
  const { data } = await api.get('/Venues/Search', {
    params,
    paramsSerializer: { indexes: null },
  })
  const paged = data.data ?? {}
  return {
    items: (paged.items ?? []).map(mapVenue),
    totalCount: paged.totalCount ?? 0,
    page: paged.page ?? 1,
    hasMore: paged.hasMore ?? false,
  }
}

// GET /Venues/GetFilterOptions — filtr panelinin seçimləri (şəhərlər, özəlliklər, aralıqlar)
export const getFilterOptions = async () => {
  const { data } = await api.get('/Venues/GetFilterOptions')
  return data.data ?? { cities: [], features: [], minPrice: 0, maxPrice: 0 }
}

// GET /Venues/GetById/{id}
export const getVenueById = async (id) => {
  const { data } = await api.get(`/Venues/GetById/${id}`)
  return mapVenue(data.data)
}

// Yüklənmiş saraylardan { hallId: Set(dolu tarixlər) } xəritəsi qurur (sorğu göndərmir)
export const buildBusyMap = (venues) => {
  const map = {}
  for (const venue of venues) {
    for (const hall of venue.halls ?? []) {
      map[hall.id] = hall.busyDates ?? new Set()
    }
  }
  return map
}

// Sarayın zallarını yoxlayaraq bu gündən sonrakı ən yaxın boş günü tapır (sorğu göndərmir)
export const getNearestFreeDate = (venue, daysAhead = 120) => {
  const halls = venue.halls ?? []
  if (!halls.length) return null

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < daysAhead; i++) {
    const key = toDateKey(cursor)
    // Ən azı bir zal həmin gün boşdursa, saray həmin tarixdə mövcud sayılır
    if (halls.some((h) => !h.busyDates?.has(key))) return key
    cursor.setDate(cursor.getDate() + 1)
  }

  return null
}
