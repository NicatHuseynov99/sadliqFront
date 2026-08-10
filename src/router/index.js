import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { trackPage } from '@/services/visitService'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/Login.vue'),
    meta: { track: 'login' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/auth/Register.vue'),
    meta: { track: 'register' },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home/Home.vue'),
    meta: { track: 'home' },
  },
  {
    path: '/venue/:id',
    name: 'venue-detail',
    component: () => import('@/pages/Venue/VenueDetail.vue'),
    meta: { track: 'venue' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/auth/ForgotPassword.vue'),
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/pages/auth/ResetPassword.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/Profile/MyProfile.vue'),
    meta: { requiresAuth: true, track: 'profile' },
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/pages/Favorites/MyFavorites.vue'),
    meta: { requiresAuth: true, track: 'favorites' },
  },
  {
    path: '/my-reservations',
    name: 'my-reservations',
    component: () => import('@/pages/Reservations/MyReservations.vue'),
    meta: { requiresAuth: true, roles: ['Customer'], track: 'reservations' },
  },
  {
    path: '/sorgularim',
    name: 'my-requests',
    component: () => import('@/pages/Requests/MyRequests.vue'),
    meta: { requiresAuth: true, roles: ['Customer'], track: 'requests' },
  },
  {
    // Şikayətlər həm müştəriyə, həm saray tərəfinə lazımdır —
    // rol məhdudiyyəti qoyulmur, siyahını backend özü filtrləyir
    path: '/sikayetlerim',
    name: 'my-disputes',
    component: () => import('@/pages/Disputes/MyDisputes.vue'),
    meta: { requiresAuth: true, track: 'disputes' },
  },
  {
    // Sahibkar müraciəti — giriş tələb olunmur, hesab elə burada açılır
    path: '/saray-elave-et',
    name: 'venue-register',
    component: () => import('@/pages/Owner/VenueRegister.vue'),
    meta: { track: 'venue-register' },
  },
  {
    path: '/panel',
    name: 'owner-panel',
    component: () => import('@/pages/Owner/OwnerPanel.vue'),
    meta: { requiresAuth: true, roles: ['Owner', 'VenueAdmin', 'SuperAdmin', 'Support'] },
  },
  {
    path: '/admin',
    name: 'admin-panel',
    component: () => import('@/pages/Admin/AdminPanel.vue'),
    meta: { requiresAuth: true, roles: ['SuperAdmin', 'Support'] },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'menu-item-active',
})

// Giriş və rol yoxlaması: icazəsi olmayan istifadəçi öz başlanğıc səhifəsinə göndərilir
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuth) {
    return { name: 'login' }
  }

  // Səhifə konkret rol üçündürsə, uyğun olmayanı öz başlanğıc səhifəsinə qaytarırıq
  if (to.meta.roles && auth.isAuth && !to.meta.roles.includes(auth.user?.role)) {
    return { name: auth.homeRoute }
  }

  if ((to.name === 'login' || to.name === 'register') && auth.isAuth) {
    return { name: auth.homeRoute }
  }
})

// Ziyarət qeydiyyatı: yalnız meta.track olan səhifələr sayılır.
// Admin və sahib panelləri qəsdən sayılmır — onlar ziyarətçi deyil.
router.afterEach((to) => {
  if (!to.meta.track) return

  trackPage({
    pageType: to.meta.track,
    path: to.fullPath,
    venueId: to.meta.track === 'venue' ? Number(to.params.id) || null : null,
    title: document.title || null,
  })
})

export default router
