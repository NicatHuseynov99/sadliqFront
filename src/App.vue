<template>
  <HeaderBlock v-if="!isAuthPage" />
  <router-view />
  <FooterBlock v-if="!isAuthPage && !isPanelPage" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBlock from './components/HeaderBlock.vue'
import FooterBlock from './components/FooterBlock.vue'

const route = useRoute()

// Giriş/qeydiyyat/parol bərpası tam ekran səhifələrdir — orada header/footer göstərmirik
const AUTH_PAGES = ['login', 'register', 'forgot-password', 'reset-password']
const isAuthPage = computed(() => AUTH_PAGES.includes(route.name))

// İdarəetmə panelləri iş alətidir — saytın tanıtım altlığı (keçidlər,
// şəhərlər, əlaqə) orada yersizdir və siyahıların altında boş yer tutur
const PANEL_PAGES = ['owner-panel', 'admin-panel']
const isPanelPage = computed(() => PANEL_PAGES.includes(route.name))
</script>
