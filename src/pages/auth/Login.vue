<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="title">Şadlıq Sarayları</h1>
      <p class="subtitle">Hesabınıza daxil olun</p>

      <el-form @submit.prevent="login">
        <el-form-item>
          <el-input v-model="form.email" placeholder="E-poçt" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="Şifrə" show-password />
        </el-form-item>

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

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

      <p class="forgot-link">
        <router-link to="/forgot-password">Parolu unutmusunuz?</router-link>
      </p>

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

.forgot-link {
  text-align: center;
  margin: 14px 0 0;
  font-size: 13px;
}

.forgot-link a {
  color: #a08a5b;
  text-decoration: none;
}

.forgot-link a:hover {
  color: #b8860b;
  text-decoration: underline;
}

.switch-link {
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.switch-link a {
  color: #b8860b;
  font-weight: 600;
  text-decoration: none;
}



/* Səhifə altındakı keçidlər 17–19px hündürlüyündə idi — barmaqla dəqiq
   vurmaq çətindir. Yazı ölçüsü eyni qalır, yalnız sahə böyüyür. */
a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
}
</style>
