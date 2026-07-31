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

export const getCities = async () => {
  const { data } = await api.get('/Platform/GetCities')
  return data.data ?? []
}

export const renameCity = async (oldName, newName) => {
  const { data } = await api.put('/Platform/RenameCity', { oldName, newName })
  return data
}

export const getFeatures = async () => {
  const { data } = await api.get('/Platform/GetFeatures')
  return data.data ?? []
}

export const renameFeature = async (oldName, newName) => {
  const { data } = await api.put('/Platform/RenameFeature', { oldName, newName })
  return data
}

export const deleteFeature = async (name) => {
  const { data } = await api.delete(`/Platform/DeleteFeature/${encodeURIComponent(name)}`)
  return data
}
