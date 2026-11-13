<template>
  <AuthShell title="Xoş gəlmisiniz" subtitle="Rezervlərinizə və sorğularınıza baxmaq üçün daxil olun.">
    <el-form @submit.prevent="login">
      <label class="auth-field">
        <span class="auth-label">E-poçt</span>
        <el-input
          v-model="form.email"
          type="email"
          inputmode="email"
          autocomplete="username"
          placeholder="ad@numune.az"
          :prefix-icon="Mail"
        />
      </label>

      <label class="auth-field">
        <span class="auth-label">Şifrə</span>
        <el-input
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          placeholder="Şifrəniz"
          show-password
          :prefix-icon="Lock"
        />
      </label>

      <div class="auth-inline">
        <router-link to="/forgot-password" class="auth-link">Parolu unutmusunuz?</router-link>
      </div>

      <p v-if="errorMessage" class="auth-error" role="alert">
        <CircleAlert :size="17" />
        {{ errorMessage }}
      </p>

      <button class="auth-submit" type="submit" :disabled="isLoading">
        <span v-if="isLoading" class="auth-spinner"></span>
        <template v-else>
          Daxil ol
          <ArrowRight :size="18" />
        </template>
      </button>
    </el-form>

    <p class="auth-switch">
      Hesabınız yoxdur?
      <router-link to="/register" class="auth-link">Qeydiyyatdan keçin</router-link>
    </p>
  </AuthShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CircleAlert, Lock, Mail } from 'lucide-vue-next'
import { useAuthStore } from '@/store/auth'
import AuthShell from '@/components/AuthShell.vue'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const isLoading = ref(false)
const errorMessage = ref('')

const login = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  try {
    await auth.login(form)
    // Hər rol öz başlanğıc səhifəsinə düşür (admin panel / saray paneli / ana səhifə)
    await router.push({ name: auth.homeRoute })
  } catch (e) {
    // Backend-dən gələn xəta mesajını formanın altında göstəririk
    errorMessage.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isLoading.value = false
  }
}
</script>
