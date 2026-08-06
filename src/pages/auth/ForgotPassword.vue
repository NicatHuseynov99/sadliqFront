<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="title">Parolu unutmusunuz?</h1>
      <p class="subtitle">E-poçt ünvanınızı yazın — sıfırlama linki göndərəcəyik</p>

      <template v-if="!isSent">
        <el-form @submit.prevent="submit">
          <el-form-item>
            <el-input v-model="email" placeholder="E-poçt" />
          </el-form-item>

          <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

          <el-button
            class="submit-btn"
            type="primary"
            native-type="submit"
            :loading="isLoading"
            @click.prevent="submit"
          >
            Link göndər
          </el-button>
        </el-form>
      </template>

      <div v-else class="sent-box">
        <div class="sent-icon">✉️</div>
        <p>{{ sentMessage }}</p>
        <span class="sent-hint">Məktub gəlmədisə, spam qovluğunu yoxlayın. Link 2 saat etibarlıdır.</span>
      </div>

      <p class="switch-link">
        <router-link to="/login">← Girişə qayıt</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { forgotPassword } from '@/services/authService'

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

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fdf6e3, #f3e2c7);
}

.auth-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 40px rgba(184, 134, 11, 0.15);
  padding: 44px 36px;
  width: 100%;
  max-width: 380px;
}

.title {
  text-align: center;
  color: #b8860b;
  font-size: 22px;
  margin-bottom: 4px;
}

.subtitle {
  text-align: center;
  color: #999;
  margin-bottom: 28px;
  font-size: 14px;
}

.form-error {
  color: #d93025;
  font-size: 13px;
  margin: 0 0 12px;
  text-align: center;
  white-space: pre-line;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  background: #b8860b;
  border-color: #b8860b;
}

.submit-btn:hover {
  background: #a3760a;
  border-color: #a3760a;
}

.sent-box {
  text-align: center;
  background: #fdf6e3;
  border: 1px dashed var(--gold);
  border-radius: 12px;
  padding: 20px 16px;
}

.sent-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.sent-box p {
  margin: 0 0 8px;
  color: #8a6220;
  font-size: 14px;
  line-height: 1.5;
}

.sent-hint {
  font-size: 12px;
  color: #a08a5b;
}

.switch-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.switch-link a {
  color: #b8860b;
  font-weight: 600;
  text-decoration: none;
}
</style>
