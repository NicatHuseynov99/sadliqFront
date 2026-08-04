// Tərs axtarış: müştəri şərtlərini paylaşır, saraylar təklif göndərir.

import api from '@/services/api'

// ————— müştəri —————

export const createRequest = async (dto) => {
  const { data } = await api.post('/VenueRequests/Create', dto)
  return { request: data.data, message: data.message }
}

export const getMyRequests = async () => {
  const { data } = await api.get('/VenueRequests/GetMine')
  return data.data ?? []
}

export const closeRequest = async (id) => {
  const { data } = await api.put(`/VenueRequests/Close/${id}`)
  return data.message ?? 'Sorğu bağlandı.'
}

export const acceptOffer = async (offerId) => {
  const { data } = await api.put(`/VenueRequests/AcceptOffer/${offerId}`)
  return data.message ?? 'Təklif qəbul edildi.'
}

export const declineOffer = async (offerId) => {
  const { data } = await api.put(`/VenueRequests/DeclineOffer/${offerId}`)
  return data.message ?? 'Təklif siyahıdan çıxarıldı.'
}

// ————— saray —————

export const getOpenRequests = async () => {
  const { data } = await api.get('/VenueRequests/GetOpen')
  return data.data ?? []
}

export const sendOffer = async (dto) => {
  const { data } = await api.post('/VenueRequests/CreateOffer', dto)
  return data.message ?? 'Təklif göndərildi.'
}

export const withdrawOffer = async (offerId) => {
  const { data } = await api.put(`/VenueRequests/WithdrawOffer/${offerId}`)
  return data.message ?? 'Təklif geri götürüldü.'
}

// Backend VenueRequestStatus sırası
export const REQUEST_STATUS = { open: 0, fulfilled: 1, closed: 2, expired: 3 }

export const requestStatusClass = (status) =>
  ({ 0: 'open', 1: 'done', 2: 'closed', 3: 'expired' })[status] ?? 'open'

// ————— yazışma —————

// Müştəri təklifi təsdiqləyir: rezerv yaranmır, söhbət açılır
export const approveContact = async (offerId) => {
  const { data } = await api.put(`/VenueRequests/ApproveContact/${offerId}`)
  return data.message ?? 'Yazışma açıldı.'
}

export const getMessages = async (offerId) => {
  const { data } = await api.get(`/VenueRequests/GetMessages/${offerId}`)
  return data.data ?? []
}

export const sendMessage = async (offerId, body) => {
  const { data } = await api.post('/VenueRequests/SendMessage', { offerId, body })
  return data.data
}

// Sahibin göndərdiyi təkliflər
export const getMyOffers = async () => {
  const { data } = await api.get('/VenueRequests/GetMyOffers')
  return data.data ?? []
}
