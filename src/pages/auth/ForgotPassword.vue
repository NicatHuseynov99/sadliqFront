<template>
  <AuthShell
    title="Parolu unutmusunuz?"
    subtitle="E-poçt ünvanınızı yazın — sıfırlama linki göndərəcəyik."
  >
    <el-form v-if="!isSent" @submit.prevent="submit">
      <label class="auth-field">
        <span class="auth-label">E-poçt</span>
        <el-input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="ad@numune.az"
          :prefix-icon="Mail"
        />
      </label>

      <p v-if="errorMessage" class="auth-error" role="alert">
        <CircleAlert :size="17" />
        {{ errorMessage }}
      </p>

      <button class="auth-submit" type="submit" :disabled="isLoading">
        <span v-if="isLoading" class="auth-spinner"></span>
        <template v-else>
          Link göndər
          <ArrowRight :size="18" />
        </template>
      </button>
    </el-form>

    <div v-else class="auth-note">
      <span class="auth-note-icon"><MailCheck :size="24" /></span>
      <p>{{ sentMessage }}</p>
      <small>Məktub gəlmədisə, spam qovluğunu yoxlayın. Link 2 saat etibarlıdır.</small>
    </div>

    <p class="auth-switch">
      <router-link to="/login" class="auth-link">Girişə qayıt</router-link>
    </p>
  </AuthShell>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight, CircleAlert, Mail, MailCheck } from 'lucide-vue-next'
import { forgotPassword } from '@/services/authService'
import AuthShell from '@/components/AuthShell.vue'

const email = ref('')
const isLoading = ref(false)
const isSent = ref(false)
const sentMessage = ref('')
const errorMessage = ref('')

// Sıfırlama linki sorğusu göndərir
const submit = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  try {
    sentMessage.value = await forgotPassword(email.value.trim())
    isSent.value = true
  } catch (e) {
    errorMessage.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isLoading.value = false
  }
}
</script>
