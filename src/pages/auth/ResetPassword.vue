<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="title">Yeni parol</h1>
      <p class="subtitle">Hesabınız üçün yeni parol təyin edin</p>

      <template v-if="!isDone">
        <el-form @submit.prevent="submit">
          <el-form-item>
            <el-input v-model="form.newPassword" type="password" show-password placeholder="Yeni parol" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.repeat" type="password" show-password placeholder="Yeni parolu təkrarlayın" />
          </el-form-item>

          <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

          <el-button
            class="submit-btn"
            type="primary"
            native-type="submit"
            :loading="isLoading"
            :disabled="!token"
            @click.prevent="submit"
          >
            Parolu yenilə
          </el-button>
        </el-form>

        <p v-if="!token" class="form-error">Link keçərsizdir — sıfırlama sorğusunu yenidən göndərin.</p>
      </template>

      <div v-else class="done-box">
        <div class="done-icon">✅</div>
        <p>{{ doneMessage }}</p>
        <router-link to="/login"><el-button class="submit-btn">Daxil ol</el-button></router-link>
      </div>

      <p class="switch-link" v-if="!isDone">
        <router-link to="/forgot-password">Yeni link istə</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { resetPassword } from '@/services/authService'

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

.done-box {
  text-align: center;
}

.done-icon {
  font-size: 2.2rem;
  margin-bottom: 10px;
}

.done-box p {
  margin: 0 0 16px;
  color: #1e7e34;
  font-size: 14px;
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
