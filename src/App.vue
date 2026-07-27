<template>
  <HeaderBlock v-if="!isAuthPage" />
  <router-view />
  <FooterBlock v-if="!isAuthPage" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBlock from './components/HeaderBlock.vue'
import FooterBlock from './components/FooterBlock.vue'

const route = useRoute()

// Login/Register tam ekran səhifələrdir — orada header/footer göstərmirik
const isAuthPage = computed(() => route.name === 'login' || route.name === 'register')
</script>
