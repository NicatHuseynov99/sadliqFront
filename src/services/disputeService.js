// Şikayət/mübahisə işləri. Müştəri saraydan, saray müştəridən şikayət edir,
// qərarı platformanın dəstək xidməti verir.

import api from '@/services/api'

export const DISPUTE_CATEGORIES = [
  { value: 0, label: 'Rezerv' },
  { value: 1, label: 'Sarayın davranışı' },
  { value: 2, label: 'Müştərinin davranışı' },
  { value: 3, label: 'Qiymət və ödəniş' },
  { value: 9, label: 'Digər' },
]

export const DISPUTE_STATUS_FILTERS = [
  { value: '', label: 'Hamısı' },
  { value: 'Open', label: 'Açıq' },
  { value: 'InReview', label: 'Baxılır' },
  { value: 'Resolved', label: 'Həll edildi' },
  { value: 'Closed', label: 'Bağlandı' },
]

// Statusa görə rəng sinfi
export const statusClass = (status) =>
  ({ 0: 'open', 1: 'review', 2: 'resolved', 3: 'closed' })[status] ?? 'open'

const mapSummary = (d) => ({
  id: d.id,
  subject: d.subject,
  category: d.category,
  categoryLabel: d.categoryLabel,
  status: d.status,
  statusLabel: d.statusLabel,
  openedByName: d.openedByName,
  openedByCustomer: d.openedByCustomer,
  venueName: d.venueName,
  reservationId: d.reservationId,
  assignedToName: d.assignedToName,
  messageCount: d.messageCount,
  lastMessageAt: d.lastMessageAt,
  createdAt: d.createdAt,
  resolvedAt: d.resolvedAt,
})

const mapMessage = (m) => ({
  id: m.id,
  senderName: m.senderName,
  isFromStaff: m.isFromStaff,
  isInternalNote: m.isInternalNote,
  body: m.body,
  createdAt: m.createdAt,
})

// POST /Disputes/Create
export const createDispute = async (dto) => {
  const { data } = await api.post('/Disputes/Create', {
    category: dto.category,
    subject: dto.subject,
    description: dto.description,
    reservationId: dto.reservationId ?? null,
    venueId: dto.venueId ?? null,
  })
  return { id: data.data, message: data.message ?? 'Şikayətiniz qeydə alındı.' }
}

// GET /Disputes/GetMine
export const getMyDisputes = async () => {
  const { data } = await api.get('/Disputes/GetMine')
  return (data.data ?? []).map(mapSummary)
}

// GET /Disputes/Get/{id}
export const getDispute = async (id) => {
  const { data } = await api.get(`/Disputes/Get/${id}`)
  const d = data.data ?? {}

  return {
    ...mapSummary(d),
    description: d.description,
    resolution: d.resolution,
    counterpartName: d.counterpartName,
    messages: (d.messages ?? []).map(mapMessage),
  }
}

// POST /Disputes/SendMessage/{id}
export const sendDisputeMessage = async (id, body, isInternalNote = false) => {
  const { data } = await api.post(`/Disputes/SendMessage/${id}`, { body, isInternalNote })
  return data.message ?? 'Mesaj göndərildi.'
}

// ————— dəstək növbəsi —————

// GET /Disputes/Search
export const searchDisputes = async (params) => {
  const { data } = await api.get('/Disputes/Search', { params })
  const paged = data.data ?? {}

  return {
    items: (paged.items ?? []).map(mapSummary),
    totalCount: paged.totalCount ?? 0,
    page: paged.page ?? 1,
    hasMore: paged.hasMore ?? false,
  }
}

// PUT /Disputes/Assign/{id} — işi öz üzərinə götürmək
export const assignDispute = async (id) => {
  const { data } = await api.put(`/Disputes/Assign/${id}`)
  return data.message ?? 'İş sizin üzərinizdədir.'
}

// PUT /Disputes/Resolve/{id} — qərar vermək
export const resolveDispute = async (id, status, resolution) => {
  const { data } = await api.put(`/Disputes/Resolve/${id}`, { status, resolution })
  return data.message ?? 'İş bağlandı.'
}
