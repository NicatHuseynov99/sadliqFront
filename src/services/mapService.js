// Xəritə rejimi üçün sorğular. Siyahı rejimindən fərqi: səhifələmə yoxdur,
// əvəzinə xəritənin görünən sahəsi (bbox) göndərilir.

import api from '@/services/api'

export const searchOnMap = async (params) => {
  const { data } = await api.get('/Venues/MapSearch', { params })
  return data.data ?? { items: [], totalMatched: 0, withoutCoordinates: 0 }
}

// Bakının mərkəzi — xəritə koordinat olmayanda buradan açılır
export const DEFAULT_CENTER = [40.3777, 49.892]
export const DEFAULT_ZOOM = 11

// Brauzerin geolokasiyası. İstifadəçi icazə verməsə və ya cihaz dəstəkləməsə
// səssizcə null qaytarırıq — xəritə onsuz da işləməlidir.
export const getMyLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)

    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.latitude, position.coords.longitude]),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300000 },
    )
  })
