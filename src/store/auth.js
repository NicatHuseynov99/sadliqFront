import { defineStore } from 'pinia'
import api from '@/services/api'

// Backend UserRole enum-u JSON-da rəqəm kimi gəlir (0=Customer, 1=Owner, 2=Admin).
// Gələcəkdə string kimi gəlsə də işləsin deyə hər iki formatı mətnə çeviririk.
const ROLE_NAMES = ['Customer', 'Owner', 'Admin']

const normalizeRole = (role) =>
  typeof role === 'number' ? (ROLE_NAMES[role] ?? 'Customer') : (role ?? 'Customer')

const normalizeUser = (user) => (user ? { ...user, role: normalizeRole(user.role) } : null)

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
    // Backend-ə login sorğusu göndərir, uğurlu olarsa token-i saxlayıb profili çəkir
    async login(payload) {
      const { data } = await api.post('/Auth/Login', payload)
      this.setToken(data.data.token)
      await this.fetchMe()
    },

    // Yeni istifadəçi qeydiyyatı (Customer/Owner)
    async register(payload) {
      await api.post('/Auth/Register', payload)
    },

    // Cari istifadəçinin məlumatını backend-dən çəkir
    async fetchMe() {
      const { data } = await api.get('/Auth/Me')
      this.setUser(data.data)
    },

    setToken(token) {
      localStorage.setItem('token', token)
      this.token = token
    },

    setUser(user) {
      const normalized = normalizeUser(user)
      localStorage.setItem('user', JSON.stringify(normalized))
      this.user = normalized
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
