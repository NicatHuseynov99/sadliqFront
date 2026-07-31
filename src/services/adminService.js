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

// POST /Admin/CreateUser — admin yeni hesab açır
export const createUser = async (payload) => {
  const { data } = await api.post('/Admin/CreateUser', payload)
  return data
}

// PUT /Admin/UpdateUser/{userId} — ad, e-poçt, telefon
export const updateUser = async (userId, payload) => {
  const { data } = await api.put(`/Admin/UpdateUser/${userId}`, payload)
  return data
}

// DELETE /Admin/DeleteUser/{userId} — yalnız sarayı və rezervi olmayan hesab silinir
export const deleteUser = async (userId) => {
  const { data } = await api.delete(`/Admin/DeleteUser/${userId}`)
  return data
}

// GET /AdminVenues/Search — bütün saraylar, süzgəclərlə
export const searchVenues = async (params) => {
  const { data } = await api.get('/AdminVenues/Search', { params })
  return data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 20, hasMore: false }
}

// PUT /AdminVenues/SetApproved/{venueId} — təsdiqi vermək və ya geri almaq
export const setVenueApproved = async (venueId, isApproved) => {
  const { data } = await api.put(`/AdminVenues/SetApproved/${venueId}`, { isApproved })
  return data
}

// PUT /AdminVenues/ChangeOwner/{venueId}
export const changeVenueOwner = async (venueId, newOwnerId) => {
  const { data } = await api.put(`/AdminVenues/ChangeOwner/${venueId}`, { newOwnerId })
  return data
}

// DELETE /AdminVenues/Delete/{venueId}
export const deleteVenue = async (venueId) => {
  const { data } = await api.delete(`/AdminVenues/Delete/${venueId}`)
  return data
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
