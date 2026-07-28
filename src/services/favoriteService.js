// Seçilmişlər (ürək) üçün API servis qatı — bütün sorğular giriş tələb edir.

import api from '@/services/api'
import { mapVenue } from '@/services/venueService'

// GET /Favorites/GetMine — seçilmiş sarayların tam siyahısı
export const getMyFavorites = async () => {
  const { data } = await api.get('/Favorites/GetMine')
  return (data.data ?? []).map(mapVenue)
}

// GET /Favorites/GetMyVenueIds — yalnız Id-lər (ürəklərin dolu/boş olmasını bilmək üçün)
export const getMyFavoriteIds = async () => {
  const { data } = await api.get('/Favorites/GetMyVenueIds')
  return new Set(data.data ?? [])
}

// POST /Favorites/Toggle/{venueId} — cavab: saray indi seçilmişdədirmi
export const toggleFavorite = async (venueId) => {
  const { data } = await api.post(`/Favorites/Toggle/${venueId}`)
  return { isFavorite: data.data, message: data.message }
}
