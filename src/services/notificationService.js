// Bildirişlər: istifadəçinin zəng siyahısı və adminin göndəriş bölməsi.

import api from '@/services/api'

// ————— istifadəçinin öz bildirişləri —————

export const getMyNotifications = async (params = {}) => {
  const { data } = await api.get('/Notifications/GetMine', { params })
  return data.data ?? { items: [], totalCount: 0, unreadCount: 0, page: 1, pageSize: 20, hasMore: false }
}

export const getUnreadCount = async () => {
  const { data } = await api.get('/Notifications/GetUnreadCount')
  return data.data ?? 0
}

export const markRead = async (id) => {
  const { data } = await api.put(`/Notifications/MarkRead/${id}`)
  return data
}

export const markAllRead = async () => {
  const { data } = await api.put('/Notifications/MarkAllRead')
  return data
}

// Linkə keçid — elanın nəticəsi ölçülsün
export const registerClick = async (id) => {
  const { data } = await api.put(`/Notifications/RegisterClick/${id}`)
  return data
}

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/Notifications/Delete/${id}`)
  return data
}

export const getPreferences = async () => {
  const { data } = await api.get('/Notifications/GetPreferences')
  return data.data ?? { allowAnnouncements: true, allowEmail: true, allowSms: true }
}

export const updatePreferences = async (dto) => {
  const { data } = await api.put('/Notifications/UpdatePreferences', dto)
  return data
}

// ————— göndəriş (admin, dəstək, saray sahibi) —————

export const previewAudience = async (audience) => {
  const { data } = await api.post('/NotificationCampaigns/Preview', audience)
  return data.data ?? { count: 0, summary: '', sample: [] }
}

export const sendCampaign = async (dto) => {
  const { data } = await api.post('/NotificationCampaigns/Send', dto)
  return data
}

export const sendTestCampaign = async (dto) => {
  const { data } = await api.post('/NotificationCampaigns/SendTest', dto)
  return data
}

export const searchCampaigns = async (params) => {
  const { data } = await api.get('/NotificationCampaigns/Search', { params })
  return data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 20, hasMore: false }
}

export const cancelCampaign = async (id) => {
  const { data } = await api.put(`/NotificationCampaigns/Cancel/${id}`)
  return data
}

// Backend enum sırası
export const CHANNELS = { inApp: 1, email: 2, sms: 4 }

export const ROLES = [
  { value: 0, label: 'Müştərilər' },
  { value: 1, label: 'Saray sahibləri' },
  { value: 3, label: 'Saray administratorları' },
  { value: 4, label: 'Dəstək' },
]

export const BEHAVIORS = [
  { value: 0, label: 'Fərq etmir', hint: 'Bütün seçilmiş auditoriya' },
  { value: 1, label: 'Son dövrdə sorğu göndərənlər', hint: 'Aktiv müştərilər' },
  { value: 2, label: 'Bəyənib, sorğu göndərməyənlər', hint: 'Ən dəyərli auditoriya' },
  { value: 3, label: 'Sorğusu alınmayanlar', hint: 'Rədd edilmiş və ya vaxtı keçmiş' },
  { value: 4, label: 'Uzun müddətdir girməyənlər', hint: 'Geri qaytarmaq üçün' },
  { value: 5, label: 'Heç vaxt sorğu göndərməyənlər', hint: 'Qeydiyyatdan keçib, dayanıb' },
]

export const CAMPAIGN_STATUSES = [
  { value: '', label: 'Hamısı' },
  { value: 'Sent', label: 'Göndərilib' },
  { value: 'Scheduled', label: 'Planlaşdırılıb' },
  { value: 'Failed', label: 'Alınmadı' },
  { value: 'Cancelled', label: 'Ləğv edilib' },
]

export const statusClass = (status) =>
  ({ 0: 'draft', 1: 'scheduled', 2: 'sending', 3: 'sent', 4: 'failed', 5: 'cancelled' })[status] ?? 'draft'
