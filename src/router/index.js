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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'menu-item-active',
})

// requiresAuth qoyulmuş səhifələrə girişi olmayanı login-ə, login olmuşu isə auth səhifələrindən ana səhifəyə yönləndirir
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuth) {
    return { name: 'login' }
  }

  if ((to.name === 'login' || to.name === 'register') && auth.isAuth) {
    return { name: 'home' }
  }
})

export default router
