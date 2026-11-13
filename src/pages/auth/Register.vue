<template>
  <!-- Əvvəlcə kim olduğunu soruşuruq: axınlar tamamilə fərqlidir.
       Müştəri bir formada bitir, restoran isə çoxaddımlı anket doldurur. -->
  <AuthShell
    v-if="!mode"
    wide
    title="TOYUN-a qoşulun"
    subtitle="Kim kimi qeydiyyatdan keçirsiniz?"
  >
    <div class="choices">
      <button type="button" class="choice" @click="mode = 'customer'">
        <span class="choice-icon"><UserRound :size="22" /></span>
        <b>Müştəriyəm</b>
        <span class="choice-text">Saray axtarıram, rezerv etmək və rəy yazmaq istəyirəm.</span>
        <span class="choice-foot">
          <span class="choice-meta">1 dəqiqə</span>
          <ArrowRight :size="18" class="choice-arrow" />
        </span>
      </button>

      <button type="button" class="choice owner" @click="goToVenueForm">
        <span class="choice-icon"><Building2 :size="22" /></span>
        <b>Saray / restoran sahibiyəm</b>
        <span class="choice-text">
          Məkanımı platformaya əlavə etmək istəyirəm: saray, yer, şəkillər, zallar və menyular.
        </span>
        <span class="choice-foot">
          <span class="choice-meta">7 addım · yoxlanışdan sonra görünür</span>
          <ArrowRight :size="18" class="choice-arrow" />
        </span>
      </button>
    </div>

    <p class="auth-switch">
      Artıq hesabınız var?
      <router-link to="/login" class="auth-link">Daxil olun</router-link>
    </p>
  </AuthShell>

  <AuthShell
    v-else
    back
    compact
    title="Müştəri qeydiyyatı"
    subtitle="Bir dəqiqəyə hesab açın və saraylara sorğu göndərin."
    @back="mode = ''"
  >
    <el-form @submit.prevent="register">
      <div class="auth-row">
        <label class="auth-field">
          <span class="auth-label">Ad</span>
          <el-input v-model="form.firstName" autocomplete="given-name" placeholder="Adınız" />
        </label>
        <label class="auth-field">
          <span class="auth-label">Soyad</span>
          <el-input v-model="form.lastName" autocomplete="family-name" placeholder="Soyadınız" />
        </label>
      </div>

      <label class="auth-field">
        <span class="auth-label">E-poçt</span>
        <el-input
          v-model="form.email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="ad@numune.az"
          :prefix-icon="Mail"
        />
      </label>

      <label class="auth-field">
        <span class="auth-label">Telefon</span>
        <el-input
          v-model="form.phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+994 50 000 00 00"
          :prefix-icon="Phone"
        />
      </label>

      <label class="auth-field">
        <span class="auth-label">Şifrə</span>
        <el-input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          placeholder="Şifrə seçin"
          show-password
          :prefix-icon="Lock"
        />
      </label>

      <p v-if="errorMessage" class="auth-error" role="alert">
        <CircleAlert :size="17" />
        {{ errorMessage }}
      </p>

      <button class="auth-submit" type="submit" :disabled="isLoading">
        <span v-if="isLoading" class="auth-spinner"></span>
        <template v-else>
          Qeydiyyatdan keç
          <ArrowRight :size="18" />
        </template>
      </button>
    </el-form>

    <p class="auth-switch">
      Artıq hesabınız var?
      <router-link to="/login" class="auth-link">Daxil olun</router-link>
    </p>
  </AuthShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Building2, CircleAlert, Lock, Mail, Phone, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/utils/toast'
import AuthShell from '@/components/AuthShell.vue'

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
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  padding: 20px 18px 16px;
  border-radius: 18px;
  border: 1px solid #e6dccd;
  background: #fff;
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--t), transform var(--t), box-shadow var(--t);
}

.choice:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(43, 7, 20, 0.1);
}

.choice-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  border-radius: 14px;
  background: var(--brand-soft);
  color: var(--brand);
}

/* Sahibkar axını platformanın böyüməsi üçün əsasdır — vurğulanır */
.choice.owner {
  border-color: #ead6a6;
  background: linear-gradient(160deg, #fffaf0, #fff 60%);
}

.choice.owner .choice-icon {
  background: var(--gold-soft);
  color: #8f6410;
}

.choice b {
  font-size: 1.04rem;
  font-weight: 600;
  color: var(--ink);
}

.choice-text {
  flex: 1;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--ink-2);
}

.choice-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
}

.choice-meta {
  font-size: 0.74rem;
  font-weight: 600;
  color: #8f6410;
  background: var(--gold-soft);
  padding: 4px 10px;
  border-radius: var(--r-pill);
}

.choice-arrow {
  flex: none;
  color: var(--faint);
  transition: color var(--t), transform var(--t);
}

.choice:hover .choice-arrow {
  color: var(--brand);
  transform: translateX(3px);
}

@media (max-width: 640px) {
  .choices {
    grid-template-columns: 1fr;
  }
}

/* Alçaq telefonda iki kart sığsın: ikon başlıqla bir sətirə keçir */
@media (max-width: 640px) and (max-height: 770px) {
  .choices {
    gap: 10px;
  }

  .choice {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 12px;
    row-gap: 5px;
    align-items: center;
    padding: 13px 14px 12px;
  }

  .choice-icon {
    width: 38px;
    height: 38px;
    margin: 0;
    border-radius: 12px;
  }

  .choice-text,
  .choice-foot {
    grid-column: 1 / -1;
  }

  .choice-text {
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .choice-foot {
    margin-top: 2px;
  }
}
/* Ən alçaq telefonda izah mətni gizlənir — başlıq və müddət kifayətdir */
@media (max-width: 640px) and (max-height: 620px) {
  .choice-text {
    display: none;
  }

  .choice {
    padding: 11px 13px 10px;
  }
}
</style>
