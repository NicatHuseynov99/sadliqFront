<template>
  <div class="auth-page">
    <!-- Əvvəlcə kim olduğunu soruşuruq: axınlar tamamilə fərqlidir.
         Müştəri bir formada bitir, restoran isə çoxaddımlı anket doldurur. -->
    <div v-if="!mode" class="auth-card choice-card">
      <h1 class="title">Qeydiyyat</h1>
      <p class="subtitle">Kim kimi qeydiyyatdan keçirsiniz?</p>

      <div class="choices">
        <button class="choice" @click="mode = 'customer'">
          <span class="choice-icon">👤</span>
          <b>Müştəriyəm</b>
          <span class="choice-text">
            Saray axtarıram, rezerv etmək və rəy yazmaq istəyirəm.
          </span>
          <span class="choice-meta">1 dəqiqə</span>
        </button>

        <button class="choice owner" @click="goToVenueForm">
          <span class="choice-icon">🏛</span>
          <b>Restoran / saray sahibiyəm</b>
          <span class="choice-text">
            Məkanımı platformaya əlavə etmək istəyirəm. Qısa anket dolduracaqsınız:
            saray, yer, şəkillər, zallar və menyular.
          </span>
          <span class="choice-meta">7 addım · yoxlanışdan sonra saytda görünür</span>
        </button>
      </div>

      <p class="switch-link">
        Artıq hesabınız var? <router-link to="/login">Daxil olun</router-link>
      </p>
    </div>

    <div v-else class="auth-card">
      <button class="back-link" @click="mode = ''">← Geri</button>

      <h1 class="title">Müştəri qeydiyyatı</h1>
      <p class="subtitle">Şadlıq Sarayları-na qoşulun</p>

      <el-form @submit.prevent="register">
        <div class="name-row">
          <el-form-item>
            <el-input v-model="form.firstName" placeholder="Ad" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.lastName" placeholder="Soyad" />
          </el-form-item>
        </div>
        <el-form-item>
          <el-input v-model="form.email" placeholder="E-poçt" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.phone" placeholder="Telefon" />
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
import { toast } from '@/utils/toast'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  firstName: '', lastName: '', email: '', phone: '', password: '', role: 'Customer',
})
const isLoading = ref(false)
const errorMessage = ref('')

// '' — seçim ekranı, 'customer' — adi qeydiyyat forması
const mode = ref('')

// Restoran sahibi çoxaddımlı ankete keçir: hesab elə orada açılır
const goToVenueForm = () => router.push({ name: 'venue-register' })

const register = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  try {
    await auth.register(form)
    toast.success('Qeydiyyat tamamlandı, daxil ola bilərsiniz')
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

/* Seçim ekranı iki karta yer verməli olduğu üçün daha genişdir */
.choice-card {
  max-width: 720px;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 22px 0 18px;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
  background: #fff;
  border: 1px solid var(--line-2);
  border-radius: 14px;
  padding: 20px 18px;
  cursor: pointer;
  transition: all 0.15s;
}

.choice:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(184, 134, 11, 0.14);
}

/* Sahibkar axını platformanın böyüməsi üçün əsasdır — vurğulanır */
.choice.owner {
  background: linear-gradient(135deg, #fffdf7, #fff);
  border-color: #f0e0bd;
}

.choice-icon {
  font-size: 1.7rem;
}

.choice b {
  font-size: 1rem;
  color: var(--ink);
}

.choice-text {
  font-size: 0.82rem;
  color: #6c757d;
  line-height: 1.55;
  flex: 1;
}

.choice-meta {
  font-size: 0.72rem;
  color: #b08d3a;
  background: #fdf6e3;
  padding: 3px 10px;
  border-radius: 20px;
  align-self: flex-start;
}

.back-link {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0 0 10px;
}

.back-link:hover {
  color: var(--brand);
}

@media (max-width: 640px) {
  .choices {
    grid-template-columns: 1fr;
  }
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

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
