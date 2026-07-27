<template>
  <header class="app-header">
    <router-link to="/" class="logo">Sadlıq <span>Sarayları</span></router-link>

    <nav class="nav-links">
      <router-link to="/">Ana səhifə</router-link>
      <router-link v-if="auth.isCustomer" to="/my-reservations">Rezervlərim</router-link>
    </nav>

    <div class="user-box" v-if="auth.isAuth">
      <span class="user-name">👤 {{ auth.user?.fullName }}</span>
      <button class="ghost-btn" @click="auth.logout()">Çıxış</button>
    </div>
    <div class="user-box" v-else>
      <router-link to="/register">
        <button class="ghost-btn">Qeydiyyat</button>
      </router-link>
      <router-link to="/login">
        <button class="gold-btn">Daxil ol</button>
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
  background: #1a1118;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: #fff;
  text-decoration: none;
}

.logo span {
  color: #dfb15b;
}

.nav-links a {
  color: #cbc3c8;
  text-decoration: none;
  margin: 0 12px;
  font-size: 0.92rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.menu-item-active {
  color: #dfb15b;
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
  color: #fff;
  font-size: 0.9rem;
}

.ghost-btn {
  background: transparent;
  color: #cbc3c8;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.ghost-btn:hover {
  color: #fff;
  border-color: #dfb15b;
}

.gold-btn {
  background: #dfb15b;
  color: #1a1118;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  transition: background 0.2s;
}

.gold-btn:hover {
  background: #c99a45;
}
</style>
