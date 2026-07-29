// Platforma sahibi (SuperAdmin) paneli üçün API servis qatı.

import api from '@/services/api'

// GET /Admin/GetStats — platformanın ümumi göstəriciləri
export const getPlatformStats = async () => {
  const { data } = await api.get('/Admin/GetStats')
  return data.data ?? {}
}

// GET /Admin/GetUsers — istifadəçi siyahısı, istəyə görə rola süzülmüş
export const getUsers = async (role) => {
  const { data } = await api.get('/Admin/GetUsers', { params: { role: role || undefined } })
  return data.data ?? []
}

// PUT /Admin/ChangeRole/{userId}
export const changeUserRole = async (userId, role) => {
  const { data } = await api.put(`/Admin/ChangeRole/${userId}`, { role })
  return data.message
}

// GET /Venues/GetPending — təsdiq gözləyən saraylar
export const getPendingVenues = async () => {
  const { data } = await api.get('/Venues/GetPending')
  return data.data ?? []
}

// PUT /Venues/Approve/{id} — sarayı təsdiqləyir, bundan sonra ictimai siyahıda görünür
export const approveVenue = async (venueId) => {
  const { data } = await api.put(`/Venues/Approve/${venueId}`)
  return data.message ?? 'Saray təsdiqləndi.'
}
