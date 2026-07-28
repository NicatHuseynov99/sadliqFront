<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="title">Qeydiyyat</h1>
      <p class="subtitle">Şadlıq Sarayları-na qoşulun</p>

      <el-form @submit.prevent="register">
        <el-form-item>
          <el-input v-model="form.fullName" placeholder="Ad Soyad" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.email" placeholder="E-poçt" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.phone" placeholder="Telefon" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="Şifrə" show-password />
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="form.role">
            <el-radio value="Customer">Müştəri</el-radio>
            <el-radio value="Owner">Restoran sahibi</el-radio>
          </el-radio-group>
        </el-form-item>

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <el-button
          class="submit-btn"
          type="primary"
          native-type="submit"
          :loading="isLoading"
          @click.prevent="register"
        >
          Qeydiyyatdan keç
        </el-button>
      </el-form>

      <p class="switch-link">
        Artıq hesabınız var? <router-link to="/login">Daxil olun</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElNotification } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  fullName: '', email: '', phone: '', password: '', role: 'Customer',
})
const isLoading = ref(false)
const errorMessage = ref('')

const register = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  try {
    await auth.register(form)
    ElNotification({ type: 'success', title: 'Uğurlu', message: 'Qeydiyyat tamamlandı, daxil ola bilərsiniz' })
    await router.push({ name: 'login' })
  } catch (e) {
    // Backend-dən gələn xəta mesajını formanın altında göstəririk
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
  max-width: 400px;
}

.title {
  text-align: center;
  color: #b8860b;
  font-size: 26px;
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

.switch-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.switch-link a {
  color: #b8860b;
  font-weight: 600;
  text-decoration: none;
}
</style>
