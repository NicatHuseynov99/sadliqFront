// Sahibkarın saray müraciəti. Bütün addımların məlumatı bir sorğuda gedir —
// yarımçıq saray yaranmasın deyə ya hamısı yazılır, ya heç nə.

import api from '@/services/api'

export const submitVenueApplication = async (payload) => {
  const { data } = await api.post('/VenueApplications/Submit', payload)
  return data
}

// Formanın addımları. «required» sahələr doldurulmadan növbəti addıma keçmək olmur.
export const STEPS = [
  { key: 'account', title: 'Hesab', icon: '👤' },
  { key: 'venue', title: 'Saray haqqında', icon: '🏛' },
  { key: 'location', title: 'Yer', icon: '📍' },
  { key: 'media', title: 'Şəkil və video', icon: '🖼' },
  { key: 'halls', title: 'Zallar', icon: '🚪' },
  { key: 'menus', title: 'Menyular', icon: '🍽' },
  { key: 'review', title: 'Yekun', icon: '✅' },
]
