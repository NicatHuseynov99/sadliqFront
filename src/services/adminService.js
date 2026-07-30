// Admin paneli (SuperAdmin və dəstək admini) üçün API servis qatı.

import api from '@/services/api'

// GET /Admin/GetStats — platformanın ümumi göstəriciləri
export const getPlatformStats = async () => {
  const { data } = await api.get('/Admin/GetStats')
  return data.data ?? {}
}

// GET /Admin/GetUsers — istifadəçi siyahısı; rola, axtarış sözünə və statusa görə süzülür
export const getUsers = async ({ role, q, status } = {}) => {
  const { data } = await api.get('/Admin/GetUsers', {
    params: {
      role: role || undefined,
      q: q?.trim() || undefined,
      status: status || undefined,
    },
  })
  return data.data ?? []
}

// GET /Admin/GetUserDetail/{userId} — bir istifadəçinin fəaliyyət kartı
export const getUserDetail = async (userId) => {
  const { data } = await api.get(`/Admin/GetUserDetail/${userId}`)
  return data.data ?? null
}

// PUT /Admin/ChangeRole/{userId}
export const changeUserRole = async (userId, role) => {
  const { data } = await api.put(`/Admin/ChangeRole/${userId}`, { role })
  return data.message
}

// PUT /Admin/SetUserActive/{userId} — hesabı bloklayır və ya blokunu götürür
export const setUserActive = async (userId, isActive) => {
  const { data } = await api.put(`/Admin/SetUserActive/${userId}`, { isActive })
  return data.message
}

// PUT /Admin/ResetUserPassword/{userId} — admin yeni parol təyin edir
export const resetUserPassword = async (userId, newPassword) => {
  const { data } = await api.put(`/Admin/ResetUserPassword/${userId}`, { newPassword })
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
