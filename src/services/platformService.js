// Platforma parametrləri və məlumat kitabçaları (şəhərlər, özəlliklər).
// Oxumaq dəstək admininə də açıqdır, dəyişmək yalnız platforma sahibinə.

import api from '@/services/api'

export const getSettings = async () => {
  const { data } = await api.get('/Platform/GetSettings')
  return data.data ?? []
}

export const updateSetting = async (key, value) => {
  const { data } = await api.put(`/Platform/UpdateSetting/${key}`, { value: String(value) })
  return data
}

// Şəhər və özəllik kitabçaları ayrıca cədvəllərdir — tam CRUD dəstəklənir.
// Hər iki kitabça eyni cür işlədiyi üçün sorğular ümumi funksiyalarla qurulur.

// entity — tək hal (City), plural — siyahı endpointinin adı (Cities).
// İngiliscə cəm həmişə «+s» olmadığı üçün ayrıca verilir.
const reference = (entity, plural) => ({
  list: async (includeDeleted = false) => {
    const { data } = await api.get(`/Platform/Get${plural}`, { params: { includeDeleted } })
    return data.data ?? []
  },
  create: async (payload) => {
    const { data } = await api.post(`/Platform/Create${entity}`, payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/Platform/Update${entity}/${id}`, payload)
    return data
  },
  remove: async (id) => {
    const { data } = await api.delete(`/Platform/Delete${entity}/${id}`)
    return data
  },
  restore: async (id) => {
    const { data } = await api.put(`/Platform/Restore${entity}/${id}`)
    return data
  },
})

export const cityApi = reference('City', 'Cities')
export const featureApi = reference('Feature', 'Features')

// İnterfeys mətnləri: kodda yalnız açar qalır, göstərilən söz bazadan gəlir
export const getTextCategories = async () => {
  const { data } = await api.get('/Platform/GetTextCategories')
  return data.data ?? []
}

export const getTexts = async (category, q) => {
  const { data } = await api.get(`/Platform/GetTexts/${category}`, { params: { q: q || undefined } })
  return data.data ?? []
}

export const createText = async (payload) => {
  const { data } = await api.post('/Platform/CreateText', payload)
  return data
}

export const updateText = async (id, payload) => {
  const { data } = await api.put(`/Platform/UpdateText/${id}`, payload)
  return data
}

export const deleteText = async (id) => {
  const { data } = await api.delete(`/Platform/DeleteText/${id}`)
  return data
}

// Saray formaları üçün sadə siyahı
export const getCities = async () => cityApi.list()
export const getFeatures = async () => featureApi.list()
