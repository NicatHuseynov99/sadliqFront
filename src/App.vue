<template>
  <div v-if="auth.isAuth">
    <HeaderBlock />
    <router-view />
  </div>
  <router-view v-else />
</template>

<script setup>
import HeaderBlock from './components/HeaderBlock.vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
</script>
