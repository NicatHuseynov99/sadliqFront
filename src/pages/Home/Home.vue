<template>
  <div class="home-page">
    <h2>Xoş gəlmisiniz, {{ auth.user?.fullName }}</h2>
    <p>Bura tezliklə saray siyahısı gələcək.</p>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
</script>

<style scoped>
.home-page {
  padding: 32px;
}
</style>
