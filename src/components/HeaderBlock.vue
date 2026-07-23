<template>
  <header class="app-header">
    <router-link to="/" class="logo">Sadlıq Sarayları</router-link>

    <nav class="nav-links">
      <router-link to="/">Ana səhifə</router-link>
    </nav>

    <div class="user-box" v-if="auth.isAuth">
      <span class="user-name">{{ auth.user?.fullName }}</span>
      <el-button size="small" @click="auth.logout()">Çıxış</el-button>
    </div>
    <div class="user-box" v-else>
      <router-link to="/register">
        <el-button size="small" text>Qeydiyyat</el-button>
      </router-link>
      <router-link to="/login">
        <el-button size="small" type="primary" class="gold-btn">Daxil ol</el-button>
      </router-link>
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
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-weight: 700;
  font-size: 20px;
  color: #b8860b;
  text-decoration: none;
}

.nav-links a {
  color: #333;
  text-decoration: none;
  margin: 0 12px;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-box a {
  text-decoration: none;
}

.user-name {
  font-weight: 500;
}

.gold-btn {
  background: #b8860b;
  border-color: #b8860b;
}

.gold-btn:hover {
  background: #a3760a;
  border-color: #a3760a;
}
</style>
