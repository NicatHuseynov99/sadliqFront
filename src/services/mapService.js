// Xəritə rejimi üçün sorğular. Siyahı rejimindən fərqi: səhifələmə yoxdur,
// əvəzinə xəritənin görünən sahəsi (bbox) göndərilir.

import api from '@/services/api'

export const searchOnMap = async (params) => {
  const { data } = await api.get('/Venues/MapSearch', { params })
  return data.data ?? { items: [], totalMatched: 0, withoutCoordinates: 0 }
}

// Bakının mərkəzi — istifadəçinin yeri bilinmirsə xəritə buradan açılır
export const DEFAULT_CENTER = [40.3777, 49.892]

// Şəhər səviyyəsi: küçələr görünür, amma ətraf da əhatə olunur
export const DEFAULT_ZOOM = 12

// Brauzerin geolokasiyası.
//
// Əvvəl uğursuzluqda səssizcə null qaytarırdı: istifadəçi düyməni basırdı,
// heç nə olmurdu və səbəb bilinmirdi. İndi nəyin alınmadığı qaytarılır ki,
// ekran bunu deyə bilsin.
//
// { coords } — alındı, { error } — alınmadı.
export const getMyLocation = () =>
  new Promise((resolve) => {
    // Brauzerlər yeri yalnız təhlükəsiz mənbədə verir: HTTPS və ya
    // localhost. Şəbəkə ünvanı ilə (məsələn 192.168.x.x:3000) sadə HTTP
    // üzərindən açılanda sorğu heç verilmir. Real domendə HTTPS ilə
    // problem qalmır.
    if (!window.isSecureContext) {
      return resolve({
        error:
          'Yer təyini yalnız təhlükəsiz bağlantıda (HTTPS) işləyir. ' +
          'Sayt domenə köçürüləndən sonra bu düymə işləyəcək.',
      })
    }

    if (!navigator.geolocation) {
      return resolve({ error: 'Bu brauzer yer təyinini dəstəkləmir.' })
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ coords: [position.coords.latitude, position.coords.longitude] }),
      (err) => {
        const messages = {
          1: 'Yerinizi göstərmək üçün brauzerdə icazə vermək lazımdır.',
          2: 'Yeriniz təyin edilə bilmədi — siqnal zəifdir.',
          3: 'Yer təyini çox uzun çəkdi, yenidən yoxlayın.',
        }
        resolve({ error: messages[err?.code] ?? 'Yeriniz təyin edilə bilmədi.' })
      },
      { timeout: 8000, maximumAge: 300000 },
    )
  })
