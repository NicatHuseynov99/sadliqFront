// Ziyarətçi statistikası: səhifə baxışlarının qeydiyyatı və admin hesabatları.
// Fəaliyyət jurnalından ayrıdır — burada «kim nəyə baxdı» sualı cavablanır.

import api from '@/services/api'

const SESSION_KEY = 'sadliq_session_id'

// Ziyarətçiyə brauzerdə qalan təsadüfi ID veririk. Şəxsiyyəti açmır,
// sadəcə eyni adamın addımlarını bir-birinə bağlayır.
export const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// Router-in hər keçidində çağırılır. Xəta olsa səssizcə udulur —
// statistika ucbatından səhifə açılmaması qəbuledilməzdir.
export const trackPage = async ({ pageType, path, venueId, title }) => {
  try {
    await api.post('/Visits/Track', {
      sessionId: getSessionId(),
      pageType,
      path,
      venueId: venueId ?? null,
      title: title ?? null,
      referrer: document.referrer || null,
    })
  } catch {
    // sükutla keçirik
  }
}

// GET /Visits/GetStats — ümumi mənzərə və qrafik
export const getVisitStats = async (days = 14) => {
  const { data } = await api.get('/Visits/GetStats', { params: { days } })
  return data.data ?? {}
}

// GET /Visits/Search — ziyarət siyahısı, süzgəclər və səhifələmə ilə
export const searchVisits = async (params) => {
  const { data } = await api.get('/Visits/Search', { params })
  return data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 30, hasMore: false }
}

export const PAGE_TYPES = [
  { value: '', label: 'Bütün səhifələr' },
  { value: 'home', label: 'Ana səhifə' },
  { value: 'venue', label: 'Saray səhifəsi' },
  { value: 'search', label: 'Axtarış / filtr' },
  { value: 'favorites', label: 'Seçilmişlər' },
  { value: 'reservations', label: 'Rezervlərim' },
  { value: 'profile', label: 'Profil' },
  { value: 'login', label: 'Giriş səhifəsi' },
  { value: 'register', label: 'Qeydiyyat səhifəsi' },
]

// Uzun user-agent sətrindən oxunaqlı brauzer adı çıxarır
export const browserName = (userAgent) => {
  if (!userAgent) return '—'
  const ua = userAgent.toLowerCase()
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('safari')) return 'Safari'
  if (ua.includes('curl')) return 'curl'
  return 'Digər'
}
