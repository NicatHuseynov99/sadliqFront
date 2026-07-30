// Fəaliyyət jurnalı — yalnız SuperAdmin və dəstək admini üçün.

import api from '@/services/api'

// Rol adlarının Azərbaycanca qarşılığı
export const ROLE_LABELS = {
  Customer: 'Müştəri',
  Owner: 'Saray rəhbərliyi',
  VenueAdmin: 'Saray administratoru',
  Support: 'Dəstək admini',
  SuperAdmin: 'Platforma sahibi',
}

// Backend UserRole enum-u rəqəm kimi gəlir
const ROLE_NAMES = ['Customer', 'Owner', 'SuperAdmin', 'VenueAdmin', 'Support']

const roleName = (role) =>
  typeof role === 'number' ? (ROLE_NAMES[role] ?? null) : role

// Əməliyyat kodunu rəngə ayırır: yaratma, dəyişmə, silmə, giriş
export const actionTone = (action = '') => {
  if (/Deleted|Rejected|Cancelled/.test(action)) return 'danger'
  if (/Created|Approved|Confirmed/.test(action)) return 'success'
  if (/Updated|Changed|Reset/.test(action)) return 'warning'
  if (/LoggedIn|Registered|Viewed/.test(action)) return 'info'
  return 'default'
}

const mapLog = (log) => ({
  id: log.id,
  userId: log.userId,
  userName: log.userFullName,
  role: roleName(log.userRole),
  roleLabel: ROLE_LABELS[roleName(log.userRole)] ?? '—',
  action: log.action,
  description: log.description,
  entityType: log.entityType,
  entityId: log.entityId,
  venueId: log.venueId,
  method: log.httpMethod,
  path: log.path,
  statusCode: log.statusCode,
  durationMs: log.durationMs,
  ip: log.ipAddress,
  userAgent: log.userAgent,
  isSuccess: log.isSuccess,
  errorMessage: log.errorMessage,
  payload: log.payload,
  createdAt: log.createdAt,
})

// GET /Audit/Search
export const searchAuditLogs = async (params) => {
  const { data } = await api.get('/Audit/Search', { params })
  const paged = data.data ?? {}

  return {
    items: (paged.items ?? []).map(mapLog),
    totalCount: paged.totalCount ?? 0,
    page: paged.page ?? 1,
    hasMore: paged.hasMore ?? false,
  }
}

// GET /Audit/GetFilterOptions — bazadakı real əməliyyat növləri
export const getAuditFilterOptions = async () => {
  const { data } = await api.get('/Audit/GetFilterOptions')
  return data.data ?? { actions: [] }
}
