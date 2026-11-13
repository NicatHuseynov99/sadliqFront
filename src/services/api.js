import axios from 'axios'
import { toast } from '@/utils/toast'

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

// Backend cavabından xəta mesajını çıxarır (Result formatı və ya ASP.NET validation formatı)
const extractMessage = (data) => {
  if (!data) return null
  if (data.message) return data.message
  if (data.errors) return Object.values(data.errors).flat().join('\n')
  if (data.title) return data.title
  return null
}

// Sorğu «silentError: true» ilə göndərilibsə bildiriş çıxmır: giriş və
// qeydiyyat formaları xətanı öz içində göstərir, ikinci dəfə lazım deyil.
const notifyError = (title, message, config) => {
  if (config?.silentError) return
  toast.error(message, title)
}

api.interceptors.response.use((response) => {
  // HTTP 200 olsa belə backend Success=false qaytara bilər
  if (response.data && response.data.success === false) {
    notifyError('Xəta', response.data.message ?? 'Naməlum xəta', response.config)
    return Promise.reject(new Error(response.data.message ?? 'Naməlum xəta'))
  }
  return response
}, (error) => {
  const status = error.response?.status
  const message = extractMessage(error.response?.data)

  // Xəta mesajını çağıran tərəfin də görə bilməsi üçün error obyektinə yazırıq
  error.userMessage = message

  if (status === 401) {
    const hadToken = !!localStorage.getItem('token')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (hadToken && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    notifyError('Giriş xətası', message ?? 'Yenidən daxil olun', error.config)
    return Promise.reject(error)
  }

  if (status === 403) {
    notifyError('İcazə yoxdur', message ?? 'Bu əməliyyat üçün icazəniz yoxdur', error.config)
    return Promise.reject(error)
  }

  if (status === 404) {
    notifyError('Tapılmadı', message ?? 'Resurs tapılmadı', error.config)
    return Promise.reject(error)
  }

  if (!error.response) {
    notifyError('Bağlantı xətası', 'Serverə qoşulmaq mümkün olmadı', error.config)
    return Promise.reject(error)
  }

  notifyError('Xəta', message ?? 'Naməlum xəta baş verdi', error.config)
  return Promise.reject(error)
})

export default api
