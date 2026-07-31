// Bazanın birbaşa idarəsi — admin panelinin "Baza" bölməsi.
// Silmək fiziki deyil: sətir IsDeleted işarəsi alır və geri qaytarıla bilir.

import api from '@/services/api'

export const getTables = async () => {
  const { data } = await api.get('/Data/GetTables')
  return data.data ?? []
}

export const getRows = async (table, params) => {
  const { data } = await api.get(`/Data/GetRows/${table}`, { params })
  return data.data ?? { columns: [], rows: [], totalCount: 0, page: 1, pageSize: 25 }
}

export const createRow = async (table, values) => {
  const { data } = await api.post(`/Data/CreateRow/${table}`, { values })
  return data
}

export const updateRow = async (table, id, values) => {
  const { data } = await api.put(`/Data/UpdateRow/${table}/${id}`, { values })
  return data
}

export const deleteRow = async (table, id) => {
  const { data } = await api.delete(`/Data/DeleteRow/${table}/${id}`)
  return data
}

export const restoreRow = async (table, id) => {
  const { data } = await api.put(`/Data/RestoreRow/${table}/${id}`)
  return data
}
