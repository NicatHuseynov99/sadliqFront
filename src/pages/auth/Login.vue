<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="title">Sadlıq Sarayları</h1>
      <p class="subtitle">Hesabınıza daxil olun</p>

      <el-form @submit.prevent="login">
        <el-form-item>
          <el-input v-model="form.email" placeholder="E-poçt" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="Şifrə" show-password />
        </el-form-item>

        <el-button
          class="submit-btn"
          type="primary"
          native-type="submit"
          :loading="isLoading"
          @click.prevent="login"
        >
          Daxil ol
        </el-button>
      </el-form>

      <p class="switch-link">
        Hesabınız yoxdur? <router-link to="/register">Qeydiyyatdan keçin</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const isLoading = ref(false)

const login = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    await auth.login(form)
    await router.push({ name: 'home' })
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
  font-size: 26px;
  margin-bottom: 4px;
}

.subtitle {
  text-align: center;
  color: #999;
  margin-bottom: 28px;
  font-size: 14px;
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
