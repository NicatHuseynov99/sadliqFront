// Müştəri ilə saray arasındakı yazışmalara adminin nəzarəti.
// Yalnız oxumaq üçündür — admin yazışmaya müdaxilə edə bilmir.

import api from '@/services/api'

const mapSummary = (c) => ({
  // Lentin kökü: təklif axını, yoxsa birbaşa rezerv. Açarkən hansı
  // endpoint-ə gedəcəyimizi bu müəyyən edir.
  threadKind: c.threadKind ?? 'Offer',
  threadId: c.threadKind === 'Reservation' ? c.reservationId : c.offerId,

  offerId: c.offerId,
  reservationId: c.reservationId,
  requestId: c.requestId,
  venueId: c.venueId,
  venueName: c.venueName,
  customerId: c.customerId,
  customerName: c.customerName,
  eventDate: c.eventDate,
  guestCount: c.guestCount,
  chatOpenedAt: c.chatOpenedAt,
  messageCount: c.messageCount,
  lastMessageAt: c.lastMessageAt,
  lastMessagePreview: c.lastMessagePreview,
  lastMessageFromCustomer: c.lastMessageFromCustomer,
})

const mapMessage = (m) => ({
  id: m.id,
  isFromCustomer: m.isFromCustomer,
  senderName: m.senderName,
  body: m.body,
  createdAt: m.createdAt,
  isRead: m.isRead,
  isHidden: m.isHidden,
  hiddenReason: m.hiddenReason,
  hiddenAt: m.hiddenAt,
})

// GET /AdminChats/Search
export const searchChats = async (params) => {
  const { data } = await api.get('/AdminChats/Search', { params })
  const paged = data.data ?? {}

  return {
    items: (paged.items ?? []).map(mapSummary),
    totalCount: paged.totalCount ?? 0,
    page: paged.page ?? 1,
    hasMore: paged.hasMore ?? false,
  }
}

// GET /AdminChats/Get/{offerId} — təklif lenti
// GET /AdminChats/GetReservation/{reservationId} — birbaşa rezerv lenti
//
// Rezerv lentində offerId null olur, ona görə köhnə kimi hər şeyi Get-ə
// göndərmək olmaz: URL «Get/null» şəklinə düşür və server onu rədd edir.
export const getChat = async (threadId, threadKind = 'Offer') => {
  const path =
    threadKind === 'Reservation'
      ? `/AdminChats/GetReservation/${threadId}`
      : `/AdminChats/Get/${threadId}`

  const { data } = await api.get(path)
  const chat = data.data ?? {}

  return {
    threadKind: chat.threadKind ?? 'Offer',
    offerId: chat.offerId,
    reservationId: chat.reservationId,
    requestId: chat.requestId,
    venueName: chat.venueName,
    ownerName: chat.ownerName,
    customerName: chat.customerName,
    eventDate: chat.eventDate,
    guestCount: chat.guestCount,
    pricePerPerson: chat.pricePerPerson,
    offerStatus: chat.offerStatus,
    chatOpenedAt: chat.chatOpenedAt,
    messages: (chat.messages ?? []).map(mapMessage),
  }
}

// PUT /AdminChats/SetHidden/{messageId}
// Mesaj silinmir — yalnız tərəflərdən gizlədilir, admin görməkdə davam edir
export const setMessageHidden = async (messageId, isHidden, reason) => {
  const { data } = await api.put(`/AdminChats/SetHidden/${messageId}`, { isHidden, reason })
  return data.message
}
