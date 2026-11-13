<template>
  <AuthShell title="Yeni parol" subtitle="Hesabınız üçün yeni parol təyin edin.">
    <template v-if="!isDone">
      <el-form @submit.prevent="submit">
        <label class="auth-field">
          <span class="auth-label">Yeni parol</span>
          <el-input
            v-model="form.newPassword"
            type="password"
            autocomplete="new-password"
            show-password
            placeholder="Yeni parol"
            :prefix-icon="Lock"
          />
        </label>

        <label class="auth-field">
          <span class="auth-label">Parolu təkrarlayın</span>
          <el-input
            v-model="form.repeat"
            type="password"
            autocomplete="new-password"
            show-password
            placeholder="Yeni parolu təkrarlayın"
            :prefix-icon="Lock"
          />
        </label>

        <p v-if="errorMessage" class="auth-error" role="alert">
          <CircleAlert :size="17" />
          {{ errorMessage }}
        </p>

        <p v-if="!token" class="auth-error" role="alert">
          <CircleAlert :size="17" />
          Link keçərsizdir — sıfırlama sorğusunu yenidən göndərin.
        </p>

        <button class="auth-submit" type="submit" :disabled="isLoading || !token">
          <span v-if="isLoading" class="auth-spinner"></span>
          <template v-else>
            Parolu yenilə
            <ArrowRight :size="18" />
          </template>
        </button>
      </el-form>

      <p class="auth-switch">
        <router-link to="/forgot-password" class="auth-link">Yeni link istə</router-link>
      </p>
    </template>

    <div v-else class="auth-note">
      <span class="auth-note-icon"><CircleCheck :size="24" /></span>
      <p>{{ doneMessage }}</p>
      <router-link to="/login" class="auth-submit done-link">
        Daxil ol
        <ArrowRight :size="18" />
      </router-link>
    </div>
  </AuthShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, CircleAlert, CircleCheck, Lock } from 'lucide-vue-next'
import { resetPassword } from '@/services/authService'
import AuthShell from '@/components/AuthShell.vue'

const route = useRoute()

// Token e-poçtdakı linkdən query parametri kimi gəlir
const token = ref(route.query.token ?? '')

const form = reactive({ newPassword: '', repeat: '' })
const isLoading = ref(false)
const isDone = ref(false)
const doneMessage = ref('')
const errorMessage = ref('')

const submit = async () => {
  if (isLoading.value) return

  if (form.newPassword !== form.repeat) {
    errorMessage.value = 'Parollar üst-üstə düşmür.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    doneMessage.value = await resetPassword(token.value, form.newPassword)
    isDone.value = true
  } catch (e) {
    errorMessage.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.done-link {
  text-decoration: none;
}
</style>
