// Müştəri ilə saray arasındakı yazışmalara adminin nəzarəti.
// Yalnız oxumaq üçündür — admin yazışmaya müdaxilə edə bilmir.

import api from '@/services/api'

const mapSummary = (c) => ({
  offerId: c.offerId,
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

// GET /AdminChats/Get/{offerId}
export const getChat = async (offerId) => {
  const { data } = await api.get(`/AdminChats/Get/${offerId}`)
  const chat = data.data ?? {}

  return {
    offerId: chat.offerId,
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
