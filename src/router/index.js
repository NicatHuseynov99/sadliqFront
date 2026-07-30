import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/Login.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/auth/Register.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home/Home.vue'),
  },
  {
    path: '/venue/:id',
    name: 'venue-detail',
    component: () => import('@/pages/Venue/VenueDetail.vue'),
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
    meta: { requiresAuth: true },
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/pages/Favorites/MyFavorites.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-reservations',
    name: 'my-reservations',
    component: () => import('@/pages/Reservations/MyReservations.vue'),
    meta: { requiresAuth: true, roles: ['Customer'] },
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

export default router
