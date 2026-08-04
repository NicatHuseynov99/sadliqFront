// Platforma üzrə rezervlər — admin panelinin "Rezervlər" bölməsi.
// Sahibin panelindən fərqi: burada bütün sarayların sorğuları bir yerdə görünür.

import api from '@/services/api'

// GET /AdminReservations/GetStats
export const getReservationStats = async () => {
  const { data } = await api.get('/AdminReservations/GetStats')
  return data.data ?? {}
}

// GET /AdminReservations/Search
export const searchReservations = async (params) => {
  const { data } = await api.get('/AdminReservations/Search', { params })
  return data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 20, hasMore: false }
}

// PUT /AdminReservations/UpdateStatus/{id}
export const updateReservationStatus = async (reservationId, status) => {
  const { data } = await api.put(`/AdminReservations/UpdateStatus/${reservationId}`, { status })
  return data
}

// Backend enum sırası: Pending, Confirmed, Rejected, Cancelled, Expired
export const RESERVATION_STATUS = {
  pending: 0,
  confirmed: 1,
  rejected: 2,
  cancelled: 3,
  expired: 4,
}

// PUT /AdminReservations/Restore/{id} — silinmiş rezervi geri qaytarır
export const restoreReservation = async (reservationId) => {
  const { data } = await api.put(`/AdminReservations/Restore/${reservationId}`)
  return data
}

export const STATUS_FILTERS = [
  { value: '', label: 'Hamısı' },
  { value: 'Pending', label: 'Gözləyir' },
  { value: 'Confirmed', label: 'Təsdiqlənib' },
  { value: 'Rejected', label: 'Rədd edilib' },
  { value: 'Cancelled', label: 'Ləğv edilib' },
  { value: 'Expired', label: 'Vaxtı keçib' },
  { value: 'Deleted', label: 'Silinmiş' },
]

// Status kodunu rəng sinfinə çevirir
export const statusClass = (status) =>
  ({ 0: 'pending', 1: 'confirmed', 2: 'rejected', 3: 'cancelled', 4: 'expired' })[status] ?? 'pending'
