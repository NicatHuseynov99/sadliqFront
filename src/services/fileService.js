// Şəkil və video yükləmə. Sahibkar link axtarmır — faylı seçir,
// server saxlayır və linkini özü qaytarır.

import api from '@/services/api'

export const uploadFile = async (file, onProgress) => {
  const body = new FormData()
  body.append('file', file)

  const { data } = await api.post('/Files/Upload', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      onProgress(Math.round((event.loaded * 100) / event.total))
    },
  })

  if (!data.success) throw new Error(data.message)

  return data.data.url
}
