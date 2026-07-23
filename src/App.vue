<template>
  <HeaderBlock v-if="!isAuthPage" />
  <router-view />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBlock from './components/HeaderBlock.vue'

const route = useRoute()

// Login/Register tam ekran səhifələrdir — orada header göstərmirik
const isAuthPage = computed(() => route.name === 'login' || route.name === 'register')
</script>
