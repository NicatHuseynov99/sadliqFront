import axios from 'axios'
import { ElNotification } from 'element-plus'

const headers = {
  Accept: 'application/json', 'Content-Type': 'application/json',
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, headers,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Backend Result/DataResult formatını (Success/Message) tanıyıb xəta bildirişi göstərir
api.interceptors.response.use((response) => {
  if (response.data && response.data.success === false) {
    ElNotification({ type: 'error', zIndex: 99999, title: 'Xəta', message: response.data.message ?? 'Naməlum xəta' })
    return Promise.reject(response.data)
  }
  return response
}, (error) => {
  const status = error.response?.status
  const message = error.response?.data?.message

  if (status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    ElNotification({ type: 'error', zIndex: 99999, title: 'Giriş xətası', message: 'Yenidən daxil olun' })
    return Promise.reject(error)
  }

  if (status === 403) {
    ElNotification({ type: 'error', zIndex: 99999, title: 'İcazə yoxdur', message: 'Bu əməliyyat üçün icazəniz yoxdur' })
    return Promise.reject(error)
  }

  if (status === 404) {
    ElNotification({ type: 'error', zIndex: 99999, title: '404', message: 'Resurs tapılmadı' })
    return Promise.reject(error)
  }

  ElNotification({ type: 'error', zIndex: 99999, title: 'Xəta', message: message ?? 'Naməlum xəta baş verdi' })
  return Promise.reject(error)
})

export default api
