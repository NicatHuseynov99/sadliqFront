// Parolun bərpası — giriş tələb olunmayan əməliyyatlar.

import api from '@/services/api'

// POST /Auth/ForgotPassword — cavab həmişə eynidir (kimin qeydiyyatda olduğu bilinməsin deyə)
export const forgotPassword = async (email) => {
  const { data } = await api.post('/Auth/ForgotPassword', { email }, { silentError: true })
  return data.message
}

// POST /Auth/ResetPassword — linkdəki token ilə yeni parol təyin edir
export const resetPassword = async (token, newPassword) => {
  const { data } = await api.post('/Auth/ResetPassword', { token, newPassword }, { silentError: true })
  return data.message
}
