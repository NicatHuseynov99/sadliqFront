import { defineStore } from 'pinia'

// MOCK auth — heç bir API çağırışı yoxdur, istifadəçilər localStorage-da saxlanılır.
// Real API qoşulanda login/register/fetchMe içindəki mock hissələr
// api.post('/Auth/Login') və s. çağırışları ilə əvəz olunacaq (köhnə kod git tarixçəsindədir).

const USERS_KEY = 'mock_users'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Qeydiyyatdan keçmiş mock istifadəçiləri oxuyur; ilk dəfə demo hesab yaradır
const readUsers = () => {
  const raw = localStorage.getItem(USERS_KEY)
  if (raw) return JSON.parse(raw)

  const seed = [
    {
      id: 1,
      fullName: 'Demo Müştəri',
      email: 'demo@sadliq.az',
      phone: '+994 50 123 45 67',
      password: 'demo123',
      role: 'Customer',
    },
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(seed))
  return seed
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),

  getters: {
    isAuth: (state) => !!state.token,
    isOwner: (state) => state.user?.role === 'Owner',
    isCustomer: (state) => state.user?.role === 'Customer',
    isAdmin: (state) => state.user?.role === 'Admin',
  },

  actions: {
    // Real: POST /Auth/Login — mock: email/şifrəni localStorage-dakı istifadəçilərlə yoxlayır
    async login(payload) {
      await delay()
      const users = readUsers()
      const found = users.find((u) => u.email === payload.email)

      if (!found) {
        const err = new Error('İstifadəçi tapılmadı.')
        err.userMessage = err.message
        throw err
      }
      if (found.password !== payload.password) {
        const err = new Error('Şifrə yanlışdır.')
        err.userMessage = err.message
        throw err
      }

      this.setToken(`mock-token-${found.id}-${Date.now()}`)
      this.setUser({
        id: found.id,
        fullName: found.fullName,
        email: found.email,
        phone: found.phone,
        role: found.role,
      })
    },

    // Real: POST /Auth/Register — mock: istifadəçini localStorage-a əlavə edir
    async register(payload) {
      await delay()
      const users = readUsers()

      if (users.some((u) => u.email === payload.email)) {
        const err = new Error('Bu email artıq qeydiyyatdan keçib.')
        err.userMessage = err.message
        throw err
      }

      users.push({
        id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        role: payload.role,
      })
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    },

    // Real: GET /Auth/Me — mock rejimdə user artıq login zamanı yazılır
    async fetchMe() {},

    setToken(token) {
      localStorage.setItem('token', token)
      this.token = token
    },

    setUser(user) {
      localStorage.setItem('user', JSON.stringify(user))
      this.user = user
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.token = null
      this.user = null
      window.location.href = '/login'
    },
  },
})
