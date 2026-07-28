// Qonaq rəyləri üçün API servis qatı.
// Oxumaq üçün giriş lazım deyil, yazmaq/silmək üçün lazımdır.

import api from '@/services/api'

// Backend rəyini səhifənin gözlədiyi formaya çevirir
const mapReview = (r) => ({
  id: r.id,
  customerId: r.customerId,
  author: r.authorName,
  rating: r.rating,
  text: r.comment,
  date: (r.createdAt ?? '').slice(0, 10),
})

// GET /Reviews/GetByVenue/{venueId}
export const getVenueReviews = async (venueId) => {
  const { data } = await api.get(`/Reviews/GetByVenue/${venueId}`)
  return (data.data ?? []).map(mapReview)
}

// POST /Reviews/Create — bir istifadəçi eyni saraya bir neçə rəy yaza bilər
export const createReview = async (venueId, rating, comment) => {
  const { data } = await api.post('/Reviews/Create', { venueId, rating, comment })
  return { review: mapReview(data.data), message: data.message }
}

// PUT /Reviews/Update/{id} — yalnız öz rəyini
export const updateReview = async (id, rating, comment) => {
  const { data } = await api.put(`/Reviews/Update/${id}`, { rating, comment })
  return { review: mapReview(data.data), message: data.message }
}

// DELETE /Reviews/Delete/{id} — yalnız öz rəyini
export const deleteReview = async (id) => {
  const { data } = await api.delete(`/Reviews/Delete/${id}`)
  return { message: data.message ?? 'Rəy silindi.' }
}
