import { defineStore } from 'pinia'
import api from '@/services/api'

// Backend UserRole enum-u JSON-da rəqəm kimi gəlir:
// 0 = Customer, 1 = Owner (saray rəhbərliyi), 2 = SuperAdmin (platforma sahibi),
// 3 = VenueAdmin (saray administratoru), 4 = Support (platformanın dəstək admini)
const ROLE_NAMES = ['Customer', 'Owner', 'SuperAdmin', 'VenueAdmin', 'Support']

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
    isSuperAdmin: (state) => state.user?.role === 'SuperAdmin',
    isVenueAdmin: (state) => state.user?.role === 'VenueAdmin',
    isSupport: (state) => state.user?.role === 'Support',

    // Panelə girişi olanlar
    canManageVenues: (state) =>
      ['Owner', 'VenueAdmin', 'SuperAdmin', 'Support'].includes(state.user?.role),

    // Saray/zal/menyu yaratmaq və administrator təyin etmək səlahiyyəti
    canEditVenues: (state) => ['Owner', 'SuperAdmin', 'Support'].includes(state.user?.role),

    // Giriş və ya yönləndirmə zamanı istifadəçinin öz başlanğıc səhifəsi
    homeRoute: (state) => {
      if (state.user?.role === 'SuperAdmin') return 'admin-panel'
      if (['Owner', 'VenueAdmin', 'Support'].includes(state.user?.role)) return 'owner-panel'
      return 'home'
    },
  },

  actions: {
    // Backend-ə login sorğusu göndərir, uğurlu olarsa token-i saxlayıb profili çəkir
    async login(payload) {
      const { data } = await api.post('/Auth/Login', payload, { silentError: true })
      this.setToken(data.data.token)
      await this.fetchMe()
    },

    // Yeni istifadəçi qeydiyyatı (Customer/Owner)
    async register(payload) {
      await api.post('/Auth/Register', payload, { silentError: true })
    },

    // Hazır token ilə sessiyanı başladır — saray müraciəti sahibkarı
    // eyni anda həm qeydiyyatdan keçirir, həm daxil edir
    async applyToken(token) {
      this.setToken(token)
      await this.fetchMe()
    },

    // Cari istifadəçinin məlumatını backend-dən çəkir
    async fetchMe() {
      const { data } = await api.get('/Auth/Me')
      this.setUser(data.data)
    },

    // Ad və telefonu yeniləyir, cavabdakı profili yaddaşa yazır
    async updateProfile(payload) {
      const { data } = await api.put('/Auth/UpdateProfile', payload)
      this.setUser(data.data)
      return data.message
    },

    // Parolu dəyişir (cari parol yoxlanılır)
    async changePassword(payload) {
      const { data } = await api.put('/Auth/ChangePassword', payload)
      return data.message
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

    async logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.token = null
      this.user = null
      // router.js bu store-u import etdiyi üçün dövri asılılıqdan qaçmaq üçün dinamik import
      const { default: router } = await import('@/router')
      router.push('/login')
    },
  },
})
