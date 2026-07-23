<template>
  <header class="app-header">
    <div class="logo">Sadlıq Sarayları</div>

    <nav class="nav-links">
      <router-link to="/">Ana səhifə</router-link>
    </nav>

    <div class="user-box">
      <span class="user-name">{{ auth.user?.fullName }}</span>
      <el-button size="small" @click="auth.logout()">Çıxış</el-button>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  background: #ffffff;
  border-bottom: 1px solid #eee;
}

.logo {
  font-weight: 700;
  font-size: 20px;
  color: #b8860b;
}

.nav-links a {
  color: #333;
  text-decoration: none;
  margin: 0 12px;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-weight: 500;
}
</style>
