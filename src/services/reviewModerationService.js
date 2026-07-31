// Rəy moderasiyası — admin panelinin "Rəylər" bölməsi üçün sorğular.
// Gizlədilən rəy silinmir: saytda görünmür, reytinqə düşmür, geri qaytarıla bilər.

import api from '@/services/api'

// GET /ReviewModeration/GetStats
export const getReviewStats = async () => {
  const { data } = await api.get('/ReviewModeration/GetStats')
  return data.data ?? {}
}

// GET /ReviewModeration/Search
export const searchReviews = async (params) => {
  const { data } = await api.get('/ReviewModeration/Search', { params })
  return data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 20, hasMore: false }
}

// GET /ReviewModeration/GetReports/{reviewId}
export const getReviewReports = async (reviewId) => {
  const { data } = await api.get(`/ReviewModeration/GetReports/${reviewId}`)
  return data.data ?? []
}

// PUT /ReviewModeration/SetHidden/{reviewId}
export const setReviewHidden = async (reviewId, isHidden, reason = null) => {
  const { data } = await api.put(`/ReviewModeration/SetHidden/${reviewId}`, { isHidden, reason })
  return data
}

// PUT /ReviewModeration/ResolveReports/{reviewId}
export const resolveReviewReports = async (reviewId) => {
  const { data } = await api.put(`/ReviewModeration/ResolveReports/${reviewId}`)
  return data
}

// DELETE /ReviewModeration/Delete/{reviewId}
export const deleteReview = async (reviewId) => {
  const { data } = await api.delete(`/ReviewModeration/Delete/${reviewId}`)
  return data
}

// POST /Reviews/Report — adi istifadəçi tərəfindən şikayət
export const reportReview = async ({ reviewId, reason, note }) => {
  const { data } = await api.post('/Reviews/Report', { reviewId, reason, note: note || null })
  return data
}

export const REPORT_REASONS = [
  { value: 'spam', label: 'Reklam / spam' },
  { value: 'offensive', label: 'Təhqiramiz dil' },
  { value: 'fake', label: 'Saxta rəy' },
  { value: 'irrelevant', label: 'Mövzuya aid deyil' },
  { value: 'other', label: 'Digər' },
]

export const REVIEW_STATUSES = [
  { value: '', label: 'Hamısı' },
  { value: 'reported', label: 'Şikayət olunan' },
  { value: 'hidden', label: 'Gizlədilmiş' },
  { value: 'visible', label: 'Görünən' },
]

// Hazır gizlətmə səbəbləri — moderator tez seçsin deyə
export const HIDE_REASONS = [
  'Reklam xarakterli mətn',
  'Təhqiramiz ifadələr',
  'Saxta və ya sifarişli rəy',
  'Mövzuya aid deyil',
  'Şəxsi məlumat açıqlanıb',
]
